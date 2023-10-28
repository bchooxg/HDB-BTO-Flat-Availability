Hi all this is user script that is used to get the flat availability for different projects

Pre Requisites:
- Tampermonkey extension https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- Installed user script from  https://greasyfork.org/en/scripts/477818-hdb-flat-availability

 Instructions :
 1. Login to HDB Page
 2. Click on my profile
 3. Click on flat applications
 4. Click on project
 5. Once on the Flat info page , refresh the page!
 6. Scroll down to flat details and availability , there should be a start button w two boxes
 7. Click on start
 8. OPTIONAL : Open browser console to view status
 9. It should take about a minute to get all the details
 10. Once done can copy the details from the right box and share in telegram chat.

More Info
Left most text box = JSON object of the data collected
Right text box = Normal formatted message
Right most text box = Mono spaced message for telegram

Known issues :
1. Page refresh does not load the project page and goes to landing page instead
 - Tends to happen when logged in for too long
 - Solution : log out and login
2. Start button missing
 - Might need to refresh the page to get the script to load