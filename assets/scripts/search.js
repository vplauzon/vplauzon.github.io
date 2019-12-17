function startScript() {
    var urlParams = new URLSearchParams(window.location.search);
    var query = urlParams.get('query');
    var searchBox = document.getElementById('search-box');
    var waitImage = document.getElementById('wait-image');
    var searchCountSection = document.getElementById('search-count-section');
    var searchCount = document.getElementById('search-count');
    var searchCountMax = document.getElementById('search-count-max');
    var topPart = document.getElementById('top-part');
    var bottomPart = document.getElementById('bottom-part');

    //  Set the query value in the search box
    searchBox.value = query;
    //  Set the focus on the search box (i.e. user inputs)
    searchBox.focus();
    searchQueryTop(query, waitImage, searchCountSection, searchCount, searchCountMax, topPart);
    searchQueryBottom(query, bottomPart);
}

function searchQueryTop(query, waitImage, searchCountSection, searchCount, searchCountMax, topPart) {
    searchQuery(query, true, function (status, responseText) {
        if (status >= 200 && status < 300) {
            var response = JSON.parse(responseText);
            var count = response["@odata.count"];
            var text = "";

            response.value.forEach(node => text += renderSearchNode(node));
            searchCount.innerText = count;
            topPart.innerHTML = text;
            if (count < 30) {
                searchCountMax.style.display = 'none';
            }
        }
        else {
            topPart.innerHTML = "<span style='color: red'>Some error occured in the search</span>";
        }
        //  Hide wait image
        waitImage.style.display = 'none';
        //  Show count
        searchCountSection.style.display = 'inline';
    });
}

function searchQueryBottom(query, bottomPart) {
    searchQuery(query, false, function (status, responseText) {
        if (status >= 200 && status < 300) {
            var response = JSON.parse(responseText);
            var text = "";

            response.value.forEach(node => text += renderSearchNode(node));
            bottomPart.innerHTML = text;
        }
        else {
            bottomPart.innerHTML = "<span style='color: red'>Some error occured in the search</span>";
        }
    });
}

function searchQuery(query, isTop, callBack) {
    var serviceUrl =
        "https://vpl-blog.azure-api.net/search?top=" + isTop + "&query=" + query;
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            callBack(this.status, this.responseText);
        }
    };
    request.open("get", serviceUrl, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("Ocp-Apim-Subscription-Key", "427f9658a6e343e6a568d8c1c7e689fa");
    request.send("");
}

function renderSearchNode(node) {
    var published = new Date(node.Published);
    var text = "";

    text += "<h2>";
    text += "<a href '" + node.Url + "'>";
    text += node.Title;
    text += "</a>";
    text += "</h2>";
    text += "<small class='small  post-meta'>";
    text += "<time class='time' datatime='" + node.Published + "'>";
    text += published.toDateString();
    text += "</time>";
    text += "&nbsp;·&nbsp;";
    text += "Tags:  ";
    text += node.Tags.join(",");
    text += "</small>";
    text += "<p>";
    text += stripHtml(node.Excerpt);
    text += "</p>";

    return text;
}

function stripHtml(html) {
    // Create a new div element
    var temporalDivElement = document.createElement("div");
    // Set the HTML content with the providen
    temporalDivElement.innerHTML = html;
    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}