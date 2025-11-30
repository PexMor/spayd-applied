#!/usr/bin/env python3
"""
Generate testing example files for the Batch SPAYD Application

This script creates bilingual test data (English and Czech):

English files (en_*):
- en_accounts.json - Bank account configurations
- en_events.json - Payment events with splits
- en_people_data_with_vs.csv - People data with variable symbols
- en_people_data_without_vs.csv - People data without variable symbols  
- en_people_data_with_vs.xlsx - Excel with VS column
- en_people_data_without_vs.xlsx - Excel without VS column

Czech files (cz_*):
- cz_accounts.json - Bankovní účty
- cz_events.json - Platební události
- cz_people_data_with_vs.csv - Osobní údaje s variabilním symbolem
- cz_people_data_without_vs.csv - Osobní údaje bez variabilního symbolu
- cz_people_data_with_vs.xlsx - Excel s VS sloupcem
- cz_people_data_without_vs.xlsx - Excel bez VS sloupce

All CSV files are generated with UTF-8 encoding to properly support Czech characters.
The batch application has been updated to handle UTF-8 encoding correctly.
"""

import json
import csv
from datetime import datetime, timedelta
import uuid

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False
    print("⚠️  Warning: openpyxl not available. Install with: uv add openpyxl")


def generate_accounts_en():
    """Generate English example bank accounts"""
    accounts = [
        {
            "id": str(uuid.uuid4()),
            "name": "Main Business Account",
            "iban": "CZ6508000000192000145399",
            "currency": "CZK",
            "logoUrl": "https://example.com/logos/business.png"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Event Collection Account",
            "iban": "CZ9455000000001234567890",
            "currency": "CZK"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Euro Account",
            "iban": "CZ3530300000001234567891",
            "currency": "EUR",
            "logoUrl": "https://example.com/logos/euro.png"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dollar Account (Testing)",
            "iban": "CZ2520100000001234567892",
            "currency": "USD"
        }
    ]
    
    with open('en_accounts.json', 'w', encoding='utf-8') as f:
        json.dump(accounts, f, indent=2, ensure_ascii=False)
    
    print("✅ Generated en_accounts.json")
    return accounts


def generate_accounts_cz():
    """Generate Czech example bank accounts"""
    accounts = [
        {
            "id": str(uuid.uuid4()),
            "name": "Hlavní firemní účet",
            "iban": "CZ6508000000192000145399",
            "currency": "CZK",
            "logoUrl": "https://example.com/logos/business.png"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Účet pro akce",
            "iban": "CZ9455000000001234567890",
            "currency": "CZK"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Euro účet",
            "iban": "CZ3530300000001234567891",
            "currency": "EUR",
            "logoUrl": "https://example.com/logos/euro.png"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dolarový účet (testovací)",
            "iban": "CZ2520100000001234567892",
            "currency": "USD"
        }
    ]
    
    with open('cz_accounts.json', 'w', encoding='utf-8') as f:
        json.dump(accounts, f, indent=2, ensure_ascii=False)
    
    print("✅ Generated cz_accounts.json")
    return accounts


def generate_events_en():
    """Generate English example events with splits"""
    today = datetime.now()
    
    events = [
        {
            "id": str(uuid.uuid4()),
            "description": "Summer Camp 2025 - Full Package",
            "vsPrefix": "2025",  # Numeric prefix
            "vsSuffixLength": 6,  # 6-digit suffix = 10 digits total (2025 + 000001)
            "ssPrefix": "",  # No SS prefix
            "ssSuffixLength": 10,  # Full 10-digit SS from CSV if provided
            "ksPrefix": "",  # KS loaded from CSV
            "ksSuffixLength": 4,  # KS is 4 digits
            "splits": [
                {
                    "amount": 3000,
                    "dueDate": (today + timedelta(days=30)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 3000,
                    "dueDate": (today + timedelta(days=60)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 2000,
                    "dueDate": (today + timedelta(days=90)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Dear {{FirstName}} {{SecondName}},

We are sending you the payment details for Summer Camp 2025.

Please find the payment schedule below, including QR codes for easy payment.

Best regards,
Organization Team"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Conference Registration Fee",
            "vsPrefix": "99",  # Numeric prefix (99)
            "vsSuffixLength": 6,  # 6-digit suffix = 8 digits total (99000001)
            "ksPrefix": "0558",  # KS fixed for this event
            "ksSuffixLength": 0,  # No suffix, KS is complete
            "splits": [
                {
                    "amount": 5000
                }
            ],
            "emailTemplate": """Dear {{FirstName}} {{SecondName}},

Thank you for registering for our conference!

Please find the payment details below, including a QR code for easy payment with your banking app.

Best regards,
Conference Team"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Membership Dues 2025 - Annual",
            "vsPrefix": "25",  # Numeric prefix (25 for year 2025)
            "vsSuffixLength": 5,  # 5-digit suffix = 7 digits total (2500001)
            "ssPrefix": "98765",  # 5-digit prefix
            "ssSuffixLength": 5,  # 5-digit suffix = 10 digits total
            "ksPrefix": "0008",  # KS fixed
            "ksSuffixLength": 0,  # No suffix
            "splits": [
                {
                    "amount": 1200,
                    "dueDate": (today + timedelta(days=14)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Dear {{FirstName}} {{SecondName}},

This is a reminder to pay your annual membership dues for 2025.

Please find the payment details below, including a QR code for easy payment.

Thank you,
Club Team"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Workshop - 3 Installments",
            "vsPrefix": "77",  # Numeric prefix (default for all splits)
            "vsSuffixLength": 6,  # 6-digit suffix
            "ksPrefix": "",  # No default KS
            "ksSuffixLength": 4,  # 4-digit suffix
            "splits": [
                {
                    "amount": 1500,
                    "dueDate": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "vsPrefix": "771"  # Override with numeric prefix (771)
                },
                {
                    "amount": 1500,
                    "dueDate": (today + timedelta(days=37)).strftime("%Y-%m-%d"),
                    "vsPrefix": "772"  # Override with numeric prefix (772)
                },
                {
                    "amount": 1000,
                    "dueDate": (today + timedelta(days=67)).strftime("%Y-%m-%d"),
                    "vsPrefix": "773",  # Override with numeric prefix (773)
                    "ksPrefix": "0308"  # Override with specific KS
                }
            ],
            "emailTemplate": """Hello {{FirstName}} {{SecondName}},

Thank you for registering for the workshop!

Please find the payment schedule below with QR codes for each installment.

Workshop Team"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "School Trip - Vienna 2025",
            "vsPrefix": "2025",  # Year as prefix
            "vsSuffixLength": 4,  # 4-digit suffix = 8 digits total
            "ksPrefix": "0308",  # Fixed KS
            "ksSuffixLength": 0,
            "splits": [
                {
                    "amount": 2500,
                    "dueDate": (today + timedelta(days=45)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 2500,
                    "dueDate": (today + timedelta(days=75)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Dear Parents of {{FirstName}} {{SecondName}},

We are sending you the payment details for the school trip to Vienna 2025.

Please find the payment schedule with QR codes for each installment below.

School"""
        }
    ]
    
    with open('en_events.json', 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    
    print("✅ Generated en_events.json")
    return events


def generate_events_cz():
    """Generate Czech example events with splits"""
    today = datetime.now()
    
    events = [
        {
            "id": str(uuid.uuid4()),
            "description": "Letní tábor 2025 - kompletní balíček",
            "vsPrefix": "2025",  # Numeric prefix (2025)
            "vsSuffixLength": 4,  # 4-digit suffix = 8 digits total (20250001)
            "ssPrefix": "12345",  # 5-digit prefix
            "ssSuffixLength": 5,  # 5-digit suffix = 10 digits total
            "ksPrefix": "0308",  # Complete KS
            "ksSuffixLength": 0,  # No suffix
            "splits": [
                {
                    "amount": 3000,
                    "dueDate": (today + timedelta(days=30)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 3000,
                    "dueDate": (today + timedelta(days=60)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 2000,
                    "dueDate": (today + timedelta(days=90)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Vážený/á {{FirstName}} {{SecondName}},

posíláme Vám platební údaje pro letní tábor 2025.

Platební údaje naleznete níže včetně QR kódu pro snadnou platbu.

S pozdravem,
Organizační tým"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Konferenční poplatek",
            "vsPrefix": "99",  # Numeric prefix (99)
            "vsSuffixLength": 6,  # 6-digit suffix = 8 digits total (99000001)
            "ksPrefix": "0558",  # Complete KS for conferences
            "ksSuffixLength": 0,  # No suffix
            "splits": [
                {
                    "amount": 5000
                }
            ],
            "emailTemplate": """Vážený/á {{FirstName}} {{SecondName}},

děkujeme za registraci na naši konferenci!

Platební údaje naleznete níže včetně QR kódu pro snadnou platbu pomocí vaší bankovní aplikace.

S pozdravem,
Konferenční tým"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Členský příspěvek 2025 - roční",
            "vsPrefix": "25",  # Numeric prefix (25 for year 2025)
            "vsSuffixLength": 5,  # 5-digit suffix = 7 digits total (2500001)
            "ssPrefix": "98765",  # 5-digit prefix
            "ssSuffixLength": 5,  # 5-digit suffix = 10 digits total
            "ksPrefix": "0008",  # KS for membership dues
            "ksSuffixLength": 0,  # No suffix
            "splits": [
                {
                    "amount": 1200,
                    "dueDate": (today + timedelta(days=14)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Dobrý den {{FirstName}} {{SecondName}},

zasíláme Vám výzvu k úhradě členského příspěvku na rok 2025.

Platební údaje naleznete níže včetně QR kódu pro platbu.

Děkujeme,
Klub"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Workshop - 3 splátky",
            "vsPrefix": "77",  # Numeric prefix (default for all splits)
            "vsSuffixLength": 6,  # 6-digit suffix
            "ksPrefix": "",  # No default KS
            "ksSuffixLength": 4,  # 4-digit suffix
            "splits": [
                {
                    "amount": 1500,
                    "dueDate": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "vsPrefix": "771"  # Override with numeric prefix (771)
                },
                {
                    "amount": 1500,
                    "dueDate": (today + timedelta(days=37)).strftime("%Y-%m-%d"),
                    "vsPrefix": "772"  # Override with numeric prefix (772)
                },
                {
                    "amount": 1000,
                    "dueDate": (today + timedelta(days=67)).strftime("%Y-%m-%d"),
                    "vsPrefix": "773",  # Override with numeric prefix (773)
                    "ksPrefix": "0308"  # Override with specific KS
                }
            ],
            "emailTemplate": """Dobrý den {{FirstName}} {{SecondName}},

děkujeme za registraci na workshop!

Platební plán včetně QR kódů pro jednotlivé splátky naleznete níže.

Tým workshopu"""
        },
        {
            "id": str(uuid.uuid4()),
            "description": "Školní zájezd - Vídeň 2025",
            "vsPrefix": "2025",  # Year as prefix
            "vsSuffixLength": 4,  # 4-digit suffix = 8 digits total
            "ksPrefix": "0308",  # Fixed KS for school trips
            "ksSuffixLength": 0,  # No suffix
            "splits": [
                {
                    "amount": 2500,
                    "dueDate": (today + timedelta(days=45)).strftime("%Y-%m-%d")
                },
                {
                    "amount": 2500,
                    "dueDate": (today + timedelta(days=75)).strftime("%Y-%m-%d")
                }
            ],
            "emailTemplate": """Vážení rodiče {{FirstName}} {{SecondName}},

zasíláme Vám platební údaje pro školní zájezd do Vídně.

Platební údaje včetně QR kódů pro jednotlivé splátky naleznete níže.

Škola"""
        }
    ]
    
    with open('cz_events.json', 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    
    print("✅ Generated cz_events.json")
    return events


def generate_people_data_with_vs_cz():
    """Generate Czech people data CSV with Variable Symbol column"""
    headers = ['FirstName', 'SecondName', 'Email', 'VS']
    
    people = [
        ['Jan', 'Novák', 'jan.novak@example.com', '202501001'],
        ['Eva', 'Svobodová', 'eva.svobodova@email.cz', '202501002'],
        ['Petr', 'Dvořák', 'petr.dvorak@gmail.com', '202501003'],
        ['Marie', 'Procházková', 'marie.prochazkova@seznam.cz', '202501004'],
        ['Tomáš', 'Veselý', 'tomas.vesely@company.com', '202501005'],
        ['Anna', 'Malá', 'anna.mala@email.cz', '202501006'],
        ['Lukáš', 'Horák', 'lukas.horak@example.com', '202501007'],
        ['Kateřina', 'Nová', 'katerina.nova@gmail.com', '202501008'],
        ['Jakub', 'Černý', 'jakub.cerny@email.cz', '202501009'],
        ['Lenka', 'Růžová', 'lenka.ruzova@company.com', '202501010'],
        ['Martin', 'Bílý', 'martin.bily@example.com', '202501011'],
        ['Veronika', 'Zelená', 'veronika.zelena@email.cz', '202501012'],
        ['David', 'Král', 'david.kral@gmail.com', '202501013'],
        ['Barbora', 'Svobodná', 'barbora.svobodna@company.com', '202501014'],
        ['Michal', 'Novotný', 'michal.novotny@example.com', '202501015']
    ]
    
    # CSV version
    with open('cz_people_data_with_vs.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(people)
    
    print("✅ Generated cz_people_data_with_vs.csv")
    
    # Excel version
    if OPENPYXL_AVAILABLE:
        wb = Workbook()
        ws = wb.active
        ws.title = "People Data"
        
        # Write headers
        ws.append(headers)
        
        # Write data
        for row in people:
            ws.append(row)
        
        # Format headers
        for cell in ws[1]:
            cell.font = Font(bold=True)
        
        wb.save('cz_people_data_with_vs.xlsx')
        print("✅ Generated cz_people_data_with_vs.xlsx")
    
    return headers, people


def generate_people_data_with_vs_en():
    """Generate English people data CSV with Variable Symbol column"""
    headers = ['FirstName', 'SecondName', 'Email', 'VS']
    
    people = [
        ['John', 'Smith', 'john.smith@example.com', '202501001'],
        ['Sarah', 'Johnson', 'sarah.johnson@email.com', '202501002'],
        ['Robert', 'Williams', 'robert.williams@company.com', '202501003'],
        ['Emily', 'Brown', 'emily.brown@example.com', '202501004'],
        ['Michael', 'Jones', 'michael.jones@email.com', '202501005'],
        ['Lisa', 'Davis', 'lisa.davis@company.com', '202501006'],
        ['James', 'Miller', 'james.miller@example.com', '202501007'],
        ['Jennifer', 'Wilson', 'jennifer.wilson@email.com', '202501008'],
        ['William', 'Moore', 'william.moore@company.com', '202501009'],
        ['Jessica', 'Taylor', 'jessica.taylor@example.com', '202501010'],
        ['David', 'Anderson', 'david.anderson@email.com', '202501011'],
        ['Mary', 'Thomas', 'mary.thomas@company.com', '202501012'],
        ['Richard', 'Jackson', 'richard.jackson@example.com', '202501013'],
        ['Patricia', 'White', 'patricia.white@email.com', '202501014'],
        ['Charles', 'Harris', 'charles.harris@company.com', '202501015']
    ]
    
    # CSV version
    with open('en_people_data_with_vs.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(people)
    
    print("✅ Generated en_people_data_with_vs.csv")
    
    # Excel version
    if OPENPYXL_AVAILABLE:
        wb = Workbook()
        ws = wb.active
        ws.title = "People Data"
        
        # Write headers
        ws.append(headers)
        
        # Write data
        for row in people:
            ws.append(row)
        
        # Format headers
        for cell in ws[1]:
            cell.font = Font(bold=True)
        
        wb.save('en_people_data_with_vs.xlsx')
        print("✅ Generated en_people_data_with_vs.xlsx")
    
    return headers, people


def generate_people_data_without_vs_en():
    """Generate English people data CSV without Variable Symbol column
    
    This version includes KS column for Scenario 1:
    - Event supplies VS prefix
    - VS suffix generated from row order (auto-increment)
    - KS loaded from people data
    """
    headers = ['FirstName', 'SecondName', 'Email', 'KS']
    
    people = [
        ['John', 'Smith', 'john.smith@example.com', '0308'],
        ['Sarah', 'Johnson', 'sarah.johnson@email.com', '0308'],
        ['Robert', 'Williams', 'robert.williams@company.com', '0008'],
        ['Emily', 'Brown', 'emily.brown@example.com', '0308'],
        ['Michael', 'Jones', 'michael.jones@email.com', '0558'],
        ['Lisa', 'Davis', 'lisa.davis@company.com', '0308'],
        ['James', 'Miller', 'james.miller@example.com', '0008'],
        ['Jennifer', 'Wilson', 'jennifer.wilson@email.com', '0308'],
        ['William', 'Moore', 'william.moore@company.com', '0558'],
        ['Jessica', 'Taylor', 'jessica.taylor@example.com', '0308'],
        ['David', 'Anderson', 'david.anderson@email.com', '0008'],
        ['Mary', 'Thomas', 'mary.thomas@company.com', '0308'],
        ['Richard', 'Jackson', 'richard.jackson@example.com', '0558'],
        ['Patricia', 'White', 'patricia.white@email.com', '0308'],
        ['Charles', 'Harris', 'charles.harris@company.com', '0008'],
        ['Linda', 'Martin', 'linda.martin@example.com', '0308'],
        ['Joseph', 'Thompson', 'joseph.thompson@email.com', '0558'],
        ['Barbara', 'Garcia', 'barbara.garcia@company.com', '0308'],
        ['Thomas', 'Martinez', 'thomas.martinez@example.com', '0008'],
        ['Susan', 'Robinson', 'susan.robinson@email.com', '0308']
    ]
    
    # CSV version
    with open('en_people_data_without_vs.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(people)
    
    print("✅ Generated en_people_data_without_vs.csv")
    
    # Excel version
    if OPENPYXL_AVAILABLE:
        wb = Workbook()
        ws = wb.active
        ws.title = "People Data"
        
        # Write headers with styling
        ws.append(headers)
        
        # Write data
        for row in people:
            ws.append(row)
        
        # Format headers
        for cell in ws[1]:
            cell.font = Font(bold=True)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        wb.save('en_people_data_without_vs.xlsx')
        print("✅ Generated en_people_data_without_vs.xlsx")
    
    return headers, people


def generate_people_data_without_vs_cz():
    """Generate Czech people data CSV without Variable Symbol column
    
    This version includes KS column for Scenario 1:
    - Event supplies VS prefix
    - VS suffix generated from row order (auto-increment)
    - KS loaded from people data
    """
    headers = ['FirstName', 'SecondName', 'Email', 'KS']
    
    people = [
        ['Jana', 'Novotná', 'jana.novotna@example.com', '0308'],
        ['Petr', 'Svoboda', 'petr.svoboda@email.cz', '0308'],
        ['Martina', 'Nováková', 'martina.novakova@seznam.cz', '0008'],
        ['Tomáš', 'Dvořák', 'tomas.dvorak@example.com', '0308'],
        ['Lucie', 'Černá', 'lucie.cerna@email.cz', '0558'],
        ['Pavel', 'Procházka', 'pavel.prochazka@company.com', '0308'],
        ['Kateřina', 'Kučerová', 'katerina.kucerova@gmail.com', '0008'],
        ['Jakub', 'Veselý', 'jakub.vesely@email.cz', '0308'],
        ['Hana', 'Horáková', 'hana.horakova@company.com', '0558'],
        ['Martin', 'Němec', 'martin.nemec@example.com', '0308'],
        ['Lenka', 'Marková', 'lenka.markova@email.cz', '0008'],
        ['Michal', 'Pospíšil', 'michal.pospisil@seznam.cz', '0308'],
        ['Barbora', 'Králová', 'barbora.kralova@example.com', '0558'],
        ['Ondřej', 'Beneš', 'ondrej.benes@email.cz', '0308'],
        ['Veronika', 'Růžičková', 'veronika.ruzickova@company.com', '0008'],
        ['Jaroslav', 'Fiala', 'jaroslav.fiala@example.com', '0308'],
        ['Kristýna', 'Malá', 'kristyna.mala@email.cz', '0558'],
        ['Radek', 'Sedláček', 'radek.sedlacek@company.com', '0308'],
        ['Simona', 'Doležalová', 'simona.dolezalova@gmail.com', '0008'],
        ['Zdeněk', 'Kolář', 'zdenek.kolar@email.cz', '0308']
    ]
    
    # CSV version
    with open('cz_people_data_without_vs.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(people)
    
    print("✅ Generated cz_people_data_without_vs.csv")
    
    # Excel version
    if OPENPYXL_AVAILABLE:
        wb = Workbook()
        ws = wb.active
        ws.title = "People Data"
        
        # Write headers with styling
        ws.append(headers)
        
        # Write data
        for row in people:
            ws.append(row)
        
        # Format headers
        for cell in ws[1]:
            cell.font = Font(bold=True)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        wb.save('cz_people_data_without_vs.xlsx')
        print("✅ Generated cz_people_data_without_vs.xlsx")
    
    return headers, people


def generate_readme():
    """Generate README explaining the test files"""
    readme_content = """# Batch SPAYD Application - Test Data Files

This directory contains testing example files for the Batch SPAYD Application.

All files are provided in two languages:
- **English files** - prefixed with `en_`
- **Czech files** - prefixed with `cz_`

## Generated Files

### 1. Accounts (Bank Account Configurations)

**English version:** `en_accounts.json`
**Czech version:** `cz_accounts.json`

**Contents:**
- 4 example accounts (CZK, EUR, USD)
- Valid Czech IBANs
- Optional logo URLs
- Account names in respective language

**Usage:** Import in Accounts section of batch application

### 2. Events (Payment Event Configurations)

**English version:** `en_events.json`
**Czech version:** `cz_events.json`

**Contents:**
- 5 different event types
- Single and multiple payment splits (1-3 splits per event)
- Different due dates
- Various VS prefixes, SS, and KS codes
- Email templates in respective language

**Event Examples:**
- Summer Camp / Letní tábor (3 installments)
- Conference Fee / Konferenční poplatek (single payment)
- Membership Dues / Členský příspěvek (with deadline)
- Workshop (3 custom splits with overrides)
- School Trip / Školní zájezd (2 payments)

**Usage:** Import in Events section of batch application

### 3. People Data Files

#### English People Data:
- `en_people_data_with_vs.csv` - 15 English names with VS codes
- `en_people_data_with_vs.xlsx` - Same data in Excel format
- `en_people_data_without_vs.csv` - 20 English names without VS
- `en_people_data_without_vs.xlsx` - Same data in Excel format

#### Czech People Data:
- `cz_people_data_with_vs.csv` - 15 Czech names with VS codes
- `cz_people_data_with_vs.xlsx` - Same data in Excel format
- `cz_people_data_without_vs.csv` - 20 Czech names without VS
- `cz_people_data_without_vs.xlsx` - Same data in Excel format

**Columns (with VS):** FirstName, SecondName, Email, Amount, VS
**Columns (without VS):** FirstName, SecondName, Email, Amount

**Note:** When VS is not provided, the application will auto-generate unique VS codes.

## How to Generate

Run the generation script:

```bash
# Using uv (recommended)
uv run python mk.py

# Or with regular Python (requires openpyxl)
pip install openpyxl
python mk.py
```

## Testing Scenarios

### Scenario 1: English Version - Basic Import with VS
1. Import `en_accounts.json` → Accounts section
2. Import `en_events.json` → Events section  
3. Import `en_people_data_with_vs.csv` → People Data section
4. Select event and generate batch payments

### Scenario 2: Czech Version - Basic Import with VS
1. Import `cz_accounts.json` → Accounts section
2. Import `cz_events.json` → Events section  
3. Import `cz_people_data_with_vs.csv` → People Data section
4. Select event and generate batch payments

### Scenario 3: Auto-Generated VS (English)
1. Import `en_accounts.json` and `en_events.json`
2. Import `en_people_data_without_vs.csv`
3. System will auto-generate VS codes
4. Generate batch payments

### Scenario 4: Auto-Generated VS (Czech)
1. Import `cz_accounts.json` and `cz_events.json`
2. Import `cz_people_data_without_vs.csv`
3. System will auto-generate VS codes
4. Generate batch payments

### Scenario 5: Excel Import
1. Import accounts and events (any language)
2. Import `*_people_data_with_vs.xlsx` or `*_people_data_without_vs.xlsx`
3. Verify Excel parsing works correctly with Czech/English names
4. Generate payments

### Scenario 6: Multiple Splits
1. Select "Summer Camp" or "Workshop" event (any language)
2. Import any people data
3. Generate batch - should create 3 separate payments per person
4. Verify different due dates and amounts

### Scenario 7: Mixed Currencies
1. Import accounts (includes EUR and USD accounts)
2. Create event linked to EUR account
3. Import people data (any language)
4. Generate payments in EUR

### Scenario 8: Mixed Languages
1. Import `en_accounts.json` and `cz_events.json`
2. Import `en_people_data_with_vs.csv`
3. Test cross-language compatibility

## Data Structure Details

### Account Schema
```json
{
  "id": "uuid",
  "name": "string",
  "iban": "CZ...",
  "currency": "CZK|EUR|USD",
  "logoUrl": "string (optional)"
}
```

### Event Schema
```json
{
  "id": "uuid",
  "description": "string",
  "vsPrefix": "string",
  "ss": "string (optional, 1-10 digits)",
  "ks": "string (optional, 4 digits)",
  "splits": [
    {
      "amount": number,
      "dueDate": "YYYY-MM-DD (optional)",
      "vsPrefix": "string (optional override)",
      "ss": "string (optional override)",
      "ks": "string (optional override)"
    }
  ],
  "emailTemplate": "string with variables"
}
```

### People Data Schema (CSV/Excel)
```
FirstName,SecondName,Email,Amount[,VS]
```

**Email Template Variables:**
- `{{FirstName}}` - Person's first name (from CSV column)
- `{{SecondName}}` - Person's second name (from CSV column)
- `{{Email}}` - Person's email address (from CSV column)
- Note: Payment details (amount, VS, IBAN, etc.) are automatically added by the application

## Validation Rules

### IBAN
- Must start with CZ
- Must be valid format

### Variable Symbol (VS)
- Max 10 digits
- Numeric only
- Must be unique per account

### Specific Symbol (SS)
- 1-10 digits
- Numeric only

### Constant Symbol (KS)
- Exactly 4 digits
- Numeric only

### Splits
- Minimum 1 split
- Maximum 3 splits per event
- Each split must have amount > 0

## Common Issues

### Issue: Import fails
- **Solution:** Ensure file encoding is UTF-8
- **Solution:** Check CSV delimiter is comma
- **Solution:** Verify first row contains headers

### Issue: Invalid IBAN error
- **Solution:** Use Czech IBAN format (CZ + 22 digits)
- **Solution:** Generate random IBAN in app if needed

### Issue: VS duplicates
- **Solution:** Ensure VS column has unique values
- **Solution:** Let app auto-generate if omitted

## File Modifications

Feel free to modify these files for your testing needs:

1. **Add more people:** Append rows to CSV/Excel files
2. **Change amounts:** Edit Amount column values
3. **Add custom events:** Modify events.json
4. **Test edge cases:** Add empty fields, special characters, etc.

## Regenerating Files

To regenerate all files with fresh UUIDs and dates:

```bash
uv run python mk.py
```

All files will be overwritten with new data.

---

**Generated:** """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """
**Script:** mk.py
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ Generated README.md")


def main():
    """Main function to generate all test files"""
    print("🚀 Generating Batch SPAYD Application test files...\n")
    
    # Generate all files
    print("📦 Generating accounts...")
    generate_accounts_en()
    generate_accounts_cz()
    
    print("\n📅 Generating events...")
    generate_events_en()
    generate_events_cz()
    
    print("\n👥 Generating people data...")
    generate_people_data_with_vs_en()
    generate_people_data_with_vs_cz()
    generate_people_data_without_vs_en()
    generate_people_data_without_vs_cz()
    
    print("\n📝 Generating documentation...")
    generate_readme()
    
    print("\n" + "="*60)
    print("✨ All test files generated successfully!")
    print("="*60)
    print("\nGenerated files:")
    print("\n  English (en_) versions:")
    print("    📄 en_accounts.json")
    print("    📄 en_events.json")
    print("    📄 en_people_data_with_vs.csv")
    print("    📄 en_people_data_without_vs.csv")
    
    print("\n  Czech (cz_) versions:")
    print("    📄 cz_accounts.json")
    print("    📄 cz_events.json")
    print("    📄 cz_people_data_with_vs.csv")
    print("    📄 cz_people_data_without_vs.csv")
    
    if OPENPYXL_AVAILABLE:
        print("\n  Excel files:")
        print("    📊 en_people_data_with_vs.xlsx")
        print("    📊 en_people_data_without_vs.xlsx")
        print("    📊 cz_people_data_with_vs.xlsx")
        print("    📊 cz_people_data_without_vs.xlsx")
    else:
        print("\n  ⚠️  Excel files not generated (openpyxl not available)")
        print("     Install with: uv add openpyxl")
    
    print("\n  📖 README.md")
    print("\n💡 Import these files into the batch application to test!")
    print("   URL: https://pexmor.github.io/spayd-applied/app/batch.html")


if __name__ == "__main__":
    main()

