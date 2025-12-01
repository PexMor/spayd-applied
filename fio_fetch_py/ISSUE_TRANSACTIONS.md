# What fails to work

```bash
export DATE_CMD=gdate
export BURL=https://fioapi.fio.cz/v1/rest
export SDATE=`$DATE_CMD +"%Y-%m-%d" -d "2 days ago"`
export EDATE=`$DATE_CMD +"%Y-%m-%d" -d "next day"`
export TOKEN=...
curl -v "${BURL}/set-last-date/${TOKEN}/${SDATE}/"
# ---
# this causes 422 regardless of previous command
curl -v "${BURL}/last/${TOKEN}/transactions.json"

# wait for 30s show number of remaining seconds
secs=30
while [ $secs -gt 0 ]; do
  printf "Waiting: $secs seconds remaining... \r"
  sleep 1
  secs=$((secs - 1))
done
echo "Done waiting........................... "
# ---
# this works !!
curl -v "${BURL}/periods/${TOKEN}/${SDATE}/${EDATE}/transactions.json"
```