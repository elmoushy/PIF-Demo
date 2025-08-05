this is a table fields this data using to fill the data of [ First Half: Months 1–6 or Quarter 3: Months 7–9 or Quarter 4: Months 10–12 ] 

13 column names
Asset Code
Entity Name (English)
Entity Name (Arabic Legal Name)
Commercial Registration (CR) Number
Ministry of Interior (MOI) Number (700 Number)
Country of Incorporation
Ownership Percentage (%)
Acquisition or Disposal Date (Only applicable for acquired/disposed entities)
Direct Parent Entity
Ultimate Parent Entity
Investment Relationship Type (e.g., Subsidiary, Associate, Joint Venture)
Ownership Structure (Direct or Indirect)
Entity’s Principal Activities

rules of each column 
1- Asset code must show only in case of if the user is "PIF_SubmitIQ" else  not show this column
2- Entity Name this is a dropdown of Entity Name this Entity Name only english text  
3- Arabic Legal Name also dropdown work by same way of Entity Name but make validation that only arabic text  
4- Commercial Registration (CR) number is required but in case of Country of incorporation = "value": "SAU" then it must be numbers only else any value accepted 
5- MOI (700) Number is required in case of Country of incorporation = "value": "SAU" then it must be numbers only else accept to be null
6- Country of incorporation is string not accept number 
7- Ownership % must be number not exceed 100 
8- Acquisition/Disposal Date Only for entities acquired/disposed is a input date but A date should not be mandatory for this column
9- Direct Parent this is a dropdown but as you know this will take many rows i need the value of  Direct Parent must be same value of Entity Name used in any other row It is not necessary to same row but it must in any row 
10- Ultimate Parent always will be with value "Direct to PIF"
11- Relationship of investment (Subsidiary/ Associate/ JV)
This should be drop down list of the below:
Subsidiary
Joint venture
Associate
Subsidiary of Associate
Joint Venture of Associate
Associate of Associate
Subsidiary of a JV
Associate 
Subsidiary 
Associate of a JV
Joint Venture of a JV

12- Direct / In-direct
This should be drop down list of: 
"Direct and In-Direct"
"Direct to PIF"
13- Entity’s principal activities string accept null