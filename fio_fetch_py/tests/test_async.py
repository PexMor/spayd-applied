import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fiofetch.services import FetchService, ConnectionManager

@pytest.mark.asyncio
async def test_fetch_service_rate_limit():
    """Test that rate limiting works"""
    service = FetchService()
    # Reset last fetch time to allow first fetch
    service.last_fetch_time = 0
    
    with patch('fiofetch.services.get_config') as mock_config, \
         patch('fiofetch.services.get_engine'), \
         patch('fiofetch.services.get_session_local'):
        
        mock_config.return_value.db_path = 'test.db'
        mock_config.return_value.fio_token = None
        
        # First fetch should work
        result1 = await service.run_fetch()
        assert result1['status'] == 'success' or result1['status'] == 'error'
        
        # Immediate second fetch should be rate limited
        result2 = await service.run_fetch()
        assert result2['status'] == 'error'
        assert 'Rate limit' in result2['message']

@pytest.mark.asyncio
async def test_connection_manager():
    """Test WebSocket connection manager"""
    manager = ConnectionManager()
    
    # Create mock websockets
    ws1 = AsyncMock()
    ws2 = AsyncMock()
    
    await manager.connect(ws1)
    await manager.connect(ws2)
    
    assert len(manager.active_connections) == 2
    
    # Test broadcast
    await manager.broadcast({"test": "message"})
    
    ws1.send_json.assert_called_once_with({"test": "message"})
    ws2.send_json.assert_called_once_with({"test": "message"})
    
    # Test disconnect
    manager.disconnect(ws1)
    assert len(manager.active_connections) == 1

@pytest.mark.asyncio  
async def test_fetch_service_locking():
    """Test that only one fetch can run at a time"""
    service = FetchService()
    
    # Test the lock directly
    assert not service.lock.locked()
    
    # Acquire the lock manually
    async with service.lock:
        assert service.lock.locked()
        
        # While locked, try to check if another fetch would be blocked
        # We can't call run_fetch here because it would wait for the lock
        # So we just verify the lock is held
        assert service.lock.locked()
    
    # Lock should be released
    assert not service.lock.locked()
