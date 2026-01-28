#!/usr/bin/env python3
"""
Python script to fetch sunrise/sunset and moonrise/moonset data from Meteo Mauritius
using the meteomoris library
"""

import sys
import json

try:
    from meteomoris import get_sunrisemu, get_moonphase
    from bs4 import BeautifulSoup
    import requests
except ImportError:
    print(json.dumps({
        "error": "Required Python packages not installed. Run: pip install meteomoris beautifulsoup4 requests"
    }), file=sys.stderr)
    sys.exit(1)


def get_moonrise_mauritius():
    """
    Scrape moonrise and moonset data from Meteo Mauritius website
    Returns data structure similar to sunrisemu for consistency
    """
    try:
        URL = "http://metservice.intnet.mu/sun-moon-and-tides-moonrise-moonset-mauritius.php"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        r = requests.get(URL, headers=headers, timeout=10)
        soup = BeautifulSoup(r.content, "html.parser")
        
        table = soup.find("table")
        if not table:
            return {}
            
        table_body = table.find("tbody")
        rows = table_body.find_all("tr") if table_body else []
        
        data = {}
        month1, month2 = None, None
        
        for i, row in enumerate(rows):
            cols = row.find_all("td")
            cols = [ele.text.strip() for ele in cols]
            
            if i == 0:  # Header row with month names
                # Extract month names from header
                month_text = cols[1] if len(cols) > 1 else ""
                # Months are in format "January 2026" and "February 2026"
                months = []
                for col in cols[1:]:
                    if col:
                        month_name = col.split()[0].lower() if col.split() else ""
                        if month_name:
                            months.append(month_name)
                
                if len(months) >= 2:
                    month1, month2 = months[0], months[1]
                    data = {month1: {}, month2: {}}
                    
            elif i >= 2 and month1 and month2:  # Data rows (skip phase/rise/set labels)
                if len(cols) >= 5:
                    try:
                        date = int(cols[0])
                        # Column structure: DATE | PHASE | MOON (month1) | PHASE | MOON (month2)
                        # Where MOON has RISE and SET on separate lines in same cell
                        
                        # Month 1 data (columns 1-2)
                        m1_times = cols[2] if len(cols) > 2 else ""
                        if m1_times and '\n' in m1_times:
                            times = m1_times.split('\n')
                            if len(times) >= 2:
                                m1_rise = times[0].strip()
                                m1_set = times[1].strip()
                                if m1_rise and m1_rise != '-':
                                    data[month1][str(date)] = {
                                        "rise": m1_rise,
                                        "set": m1_set if m1_set != '-' else 'N/A'
                                    }
                        
                        # Month 2 data (columns 3-4)
                        m2_times = cols[4] if len(cols) > 4 else ""
                        if m2_times and '\n' in m2_times:
                            times = m2_times.split('\n')
                            if len(times) >= 2:
                                m2_rise = times[0].strip()
                                m2_set = times[1].strip()
                                if m2_rise and m2_rise != '-':
                                    data[month2][str(date)] = {
                                        "rise": m2_rise,
                                        "set": m2_set if m2_set != '-' else 'N/A'
                                    }
                    except (ValueError, IndexError):
                        continue
        
        return data
    except Exception as e:
        print(json.dumps({"error": f"Failed to scrape moonrise data: {str(e)}"}), file=sys.stderr)
        return {}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "sunrisemu":
            # Get sunrise/sunset data for Mauritius
            data = get_sunrisemu()
            print(json.dumps(data))
            
        elif command == "moonrisemu":
            # Get moonrise/moonset data for Mauritius
            data = get_moonrise_mauritius()
            print(json.dumps(data))
            
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}), file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
