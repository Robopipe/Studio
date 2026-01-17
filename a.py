# load ./data.csv, remove first and last columns and then print the result as sql tuples
import csv

with open('data.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        # Remove first and last columns
        trimmed_row = row[1:-1]
        # Print as SQL tuple
        print(f"({', '.join(repr(item) for item in trimmed_row)}),")