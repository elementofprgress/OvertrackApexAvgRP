// ==UserScript==
// @name        Apex RP Overtrack
// @description Calculate RP & Avg RP based on stats available.
// @author      Elementofprgress
// @icon        https://cdn.overtrack.gg/static/images/favicon.png
// @version     1.0.2
// @namespace   https://github.com/elementofprgress
// @updateURL   https://raw.githubusercontent.com/elementofprgress/OvertrackApexAvgRP/master/downloads/Overtrack_Apex_Avg_RP-meta.js
// @downloadURL https://raw.githubusercontent.com/elementofprgress/OvertrackApexAvgRP/master/downloads/Overtrack_Apex_Avg_RP.js
// @match       *overtrack.gg/apex/games?season=*&ranked=true*
// @connect     *
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_info
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==
(function(){
    if ($("#gamesListBody")[0].children[2].lastElementChild.className === "rp-delta")
    {
        function addButton(text, onclick, cssObj) {
            cssObj = cssObj || {position: 'fixed', 'text-align': 'center', 'background-color': '#212529', 'border-color': 'rgba(255,255,255,0.05)', 'color': 'white', top: '90%', left: '2%', 'width': '10%', 'z-index': 3};
            let button = document.createElement('button'), btnStyle = button.style;
            document.body.appendChild(button);
            button.innerHTML = text;
            button.onclick = onclick;
            Object.keys(cssObj).forEach(key => btnStyle[key] = cssObj[key]);
            return button
        }

        function getAvgRP(){
            //console.log("GET AVERAGE RP");
            let element1 = document.getElementsByClassName('avg_rp-delta')[0];
            if (typeof(element1) != 'undefined' && element1 != null)
            {
                element1.remove();
            }
            var sideCard_cssObj = sideCard_cssObj || {position: 'fixed', top: '30%', left: '85.9%', 'pointer-events': 'none'};
            var sideCard_element = document.createElement('sideCard_element'), sideCard_style = sideCard_element.style;
            document.body.appendChild(sideCard_element);
            var rtnStr = "<div style='padding: 5px; font-size: 14px;' class='avg_rp-delta'>Avg RP</div><div class='avg_rp-delta_val' style='text-align: right; font-size: 24px; line-height: 1; font-weight: bold; text-align: center; padding-top: 10px; padding-bottom: 10px;'>000</div>";
            sideCard_element.innerHTML = rtnStr;
            Object.keys(sideCard_cssObj).forEach(key => sideCard_style[key] = sideCard_cssObj[key]);
            sideCard_element.setAttribute("class", "avg_rp-delta table-dark table-borderless table-striped table-hover shadow games-list narrow")

            var avg = 0;
            var avg_count = 0;
            for (const [key, value] of Object.entries($("#gamesListBody")[0].children)) {
                if (value.childElementCount > 9) {
                    var tempNumx = Number(value.children[9].innerText);
                    console.log("Match #%s Match RP: %s CurTotal:  %s", avg_count, tempNumx, avg)
                    avg = avg + tempNumx;
                    avg_count = avg_count + 1;
                }
            }
            var totalavgrp = Number(avg)/Number(avg_count);
            console.log("avg/avg_count = x | %s / %s = %s ", avg, avg_count, totalavgrp);
            $(".avg_rp-delta_val")[0].textContent = Number(totalavgrp).toString();

        };

        addButton('Calculate Average RP', getAvgRP);

        unsafeWindow.firstPass = false;
        window.addEventListener('load', () => {
            update_rp();
            document.addEventListener("DOMContentLoaded", function(event) {
                update_rp();
            });
        });
        var targetNodes = $("#gamesListBody");
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var myObserver = new MutationObserver (mutationHandler);
        var obsConfig = { childList: true, characterData: true, attributes: true, subtree: true };

        targetNodes.each ( function () {
            myObserver.observe (this, obsConfig);
        } );

        function mutationHandler (mutationRecords) {
            mutationRecords.forEach ( function (mutation) {
                if (mutation.type === "attributes" && mutation.target.rowIndex === $("#gamesListBody")[0].childElementCount){
                    update_rp();
                };
            } );
        }
        var matchStats;
        var placementPoints = { 11: 0, 10: 10, 9: 10, 8: 20, 7: 20, 6: 30, 5: 30, 4: 40, 3: 40, 2: 60, 1: 100};
        var kill_assist_multi = { 11: 0, 10: 12, 9: 12, 8: 12, 7: 12, 6: 12, 5: 15, 4: 15, 3: 20, 2: 20, 1: 25};
        var rank_cost = {'bronze': 0, 'silver': -12, 'gold': -24, 'platinum': -36, 'diamond': -4484, 'master': -60, 'apex_predator': -60};


        function dostuff(dataurl, match_row_index){
            var match_row = document.getElementById("gamesListBody").children[match_row_index];
            var ret = GM_xmlhttpRequest({
                method: "GET",
                url: dataurl,
                onload: function(res) {
                    matchStats = JSON.parse(res.responseText);
                    var rp_cost = rank_cost[matchStats.rank.rank];
                    var elim_count = Math.min(Math.max((matchStats.kills + matchStats.combat.elimination_assists.length), 0), 5);
                    var elim_multi = kill_assist_multi[Math.min(Math.max(matchStats.placed, 0), 11)];
                    var elim_rp = elim_count * elim_multi;
                    var placement_rp = placementPoints[Math.min(Math.max(matchStats.placed, 0), 11)];
                    var new_rp = (elim_rp + placement_rp) + rp_cost;
                    if(new_rp > 0){
                        match_row.children[9].textContent = "\n            +".concat(new_rp).concat("\n        ");
                    } else {
                        match_row.children[9].textContent = "\n            ".concat(new_rp).concat("\n        ");
                    }

                }
            });
        };


        function update_rp(){
            var i;
            for (i = 2; i < document.getElementById("gamesListBody").childElementCount; i = i + 3) {
                var base_url = "https://overtrack-apex-games.s3.amazonaws.com/";
                var match_key = document.getElementById("gamesListBody").children[i].attributes['data-key'].textContent;
                var match_data = base_url.concat(match_key).concat('.json');
                dostuff(match_data, i);
            }
            unsafeWindow.firstPass = true;
        };
        update_rp();
    }
}())
