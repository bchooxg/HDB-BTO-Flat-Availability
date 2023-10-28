// ==UserScript==
// @name         HDB Flat Availability
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Script to get the current available / taken flats for HDB BTO Selection
// @author       You
// @match        https://homes.hdb.gov.sg/home/bto/details/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=undefined.
// @grant        none
// @license      MIT
// ==/UserScript==
(function () {
  'use strict';

  // Wait for 2 Seconds for Ajax queries to complete first before running script
  setTimeout(() => {
     main();
  }, 2000)

  function main() {

     let data = {"blocks":{},"summary":{} };
     let blocks = [];

     // Create a text area on screen
     let container_div = document.evaluate("/html/body/app-root/div[2]/app-bto-details/section/div/div[5]/div/div[1]/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
     const text_area = document.createElement("textarea"); // For JSON message
     const text_area2 = document.createElement("textarea"); // For normal non telegram forammted message
     const text_area3 = document.createElement("textarea"); // tele msg fomatted
     const start_btn = document.createElement("button");
     const status = document.createElement("p");

     // Get the first option in select
     let room_type = document.getElementById("choose-room-type").options[1].text;

     // Get the name of the project
     let project = document.getElementsByClassName("col-12 col-sm-8 col-md-8 mb-5 mb-md-0")[0].getElementsByTagName("h4")[0].innerHTML

     // Add function to button
     start_btn.innerHTML = "Start"
     start_btn.onclick = function () {
        runner()
     };


     container_div.appendChild(text_area);
     container_div.appendChild(start_btn);
     container_div.appendChild(text_area2);
     container_div.appendChild(text_area3);
     container_div.appendChild(status);
    function formatTeleMonospace(msg){
          let newMsg = "";
          var lines = msg.split("\n");
          for (let i =0; i < lines.length; i ++ ){
              if(lines[i].length != 0){
                  newMsg += `\`\`\`${lines[i]}\`\`\`\n`;
              }else{
                  newMsg += "\n"
              }
          }
          return newMsg
        }
     function formatMsg(json){
         let msg = "";
          msg = `${project}\n${room_type}\n`
          msg += `Generated on ${new Date().toLocaleString()}\n\n`

          for (const [block, blk_details] of Object.entries(json.blocks)) {
              let floors = blk_details['unit_info'];
              let quota = blk_details['quota'];
              let summary = blk_details['summary'];
              msg += `\n${block}\n`;

              let seen_units = {};

              for (const [floor, units] of Object.entries(floors)) {
                  msg+= floor
                  let first_floor_flag = floor == Object.keys(floors)[Object.keys(floors).length - 1];
                  //console.debug(`first_floor flag ${first_floor_flag} curr_floor ${floor} first floor ${Object.keys(floors)[Object.keys(floors).length - 1]} `)
                  for (const [unit, unit_details] of Object.entries(units)) {
                      if (unit_details.avail){ msg += "  🟢  "  }else{  msg += "  🔴  " }
                      //if (first_floor_flag){ msg += ` ${unit} `; }
                      if (unit in seen_units){ seen_units[unit] += 1 }else {seen_units[unit] = 1}
                  }
                  msg += "\n"
              }
              msg += '   '
              for (let unit of Object.keys(seen_units)){
                  msg += ` ${unit}  `
              }
              msg += "\n"
              for ( let [race, qty] of Object.entries(quota) ){

                  msg += `   ${race}:${qty}`

              }
              msg += "\n"
              // Add Block Summary
              msg += `   Total:${summary.total} Taken:${summary.taken} Avail:${summary.avail}\n`

          }
         // Add Project Summary
         msg += `\nTotal:${json.summary.total} Taken:${json.summary.taken} Avail:${json.summary.avail}`
         console.debug(msg);
         return msg;
      }

     function runner() {
         console.debug("Running Script");

        // Get the list of different blocks
        var select_block = document.querySelector('[aria-label="Block"]');
        for (let i = 0; i < select_block.options.length; i++) {
           var option = select_block.options[i];
           if (option.innerHTML != "Choose Block No.") {
              let block_info = option.innerHTML
              blocks.push(block_info);
              data["blocks"][block_info] = {};
           }
        }
        // Get the grid element
        let project_total = 0;
        let project_taken = 0;

        for (let k = 0; k < blocks.length; k ++ ){
            let block_total = 0;
            let block_taken = 0;

            console.debug("Inside " + blocks[k]);
            status.innerHTML = `Processing for ${blocks[k]}`
            const grid = document.getElementById("available-grid");
            let floors = grid.getElementsByClassName("row level");
            select_block.value = k;
            var event = new Event('change');
            select_block.dispatchEvent(event);

            let curr_block = blocks[k]

            // get quota
            let quota_elems = document.getElementById("available-sidebar").getElementsByClassName("col-12 col-md-auto");
            let quota_obj = {}
            for ( let quota of quota_elems ){

                let quota_split = quota.innerHTML.trim().split(": ")
                quota_obj[quota_split[0]] = quota_split[1];
            }
            data["blocks"][curr_block]["quota"] = quota_obj
            data['blocks'][curr_block]["unit_info"] = {}


            // Iterate through each row in the grid
            for (let i = 0; i < floors.length; i++) {
                let curr_floor = floors[i];
                let labels_curr_floor = curr_floor.getElementsByTagName("label");
                let curr_floor_text = labels_curr_floor[0].innerHTML;
                if (data['blocks'][curr_block]["unit_info"][curr_floor_text] == undefined) {
                    data['blocks'][curr_block]["unit_info"][curr_floor_text] = {}
                }
                for (let j = 1; j < labels_curr_floor.length; j++) {
                    let curr_unit_label = labels_curr_floor[j]; // should have length of 0 = unit , 2 = sqm, 4 = price
                    let curr_unit_nodes = curr_unit_label.childNodes; // should have length of 0 = unit , 2 = sqm, 4 = price
                    let curr_p1 = curr_unit_nodes[0].data;
                    let curr_p2 = curr_unit_nodes[2].data;
                    let curr_p3 = curr_unit_nodes[4].data;
                    let curr_p4 = curr_unit_label.parentElement.hasAttribute("disabled");
                    block_total+= 1;
                    if (curr_p4) {block_taken+= 1}


                    data['blocks'][curr_block]["unit_info"][curr_floor_text][curr_p1] = {
                        "sqm": curr_p2,
                        "price": curr_p3,
                        "avail": !curr_p4
                    };
                }

            }
            data['blocks'][curr_block]["summary"] = {
                "total":block_total,
                "taken":block_taken,
                "avail":block_total-block_taken,
            }

            project_total += block_total;
            project_taken += block_taken;
        }
        data.summary.total = project_total;
        data.summary.taken = project_taken;
        data.summary.avail = project_total-project_taken;
        text_area.value = JSON.stringify(data);
        let msg = formatMsg(data)
        text_area2.value = msg ;
        text_area3.value = formatTeleMonospace(msg);
     }




     // Once complete click the next select element and wait
     // return a message
  }

})();