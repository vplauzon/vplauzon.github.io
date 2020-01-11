function setupCommentForm() {
    var status = document.getElementById('commentstatus');
    status.innerText = '';

    var requiredIds = ['content', 'name'];
    var missing = requiredIds.filter(id => document.getElementById(id).value.length < 3);

    if (missing.length > 0) {
        status.innerText = 'Some required fields are missing - (' + missing.join(', ') + ')';

        return;
    }

    var request = new XMLHttpRequest();
    var content = document.getElementById('content').value;
    var name = document.getElementById('name').value;
    var url = document.getElementById('url').value;
    var postId = document.getElementById('post_id').value;
    var inputPayload = {
        pagePath: postId,
        userName: name,
        webSite: url,
        content: content
    };
    var fields = document.getElementById('commentfields');
    var button = document.getElementById('commentbutton');

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            lastAnalysisTime = new Date().getTime();

            if (this.status >= 200 && this.status < 300) {
                button.innerText = 'Comment submitted';
            }
            else {
                status.innerText = 'Error submitting comment';
                button.innerText = 'Leave response';
                button.disabled = false;
                fields.disabled = false;
            }
            if (isAnalysisQueued) {
                queueAnalysis(grammar, sample, analysisText);
            }
            else {
                isAnalyzing = false;
                analysisText.classList.remove("callInProgress");
            }
        }
    };
    request.open("post", 'https://vpl-blog-apim.azure-api.net/comment-api/', true);
    request.setRequestHeader("Ocp-Apim-Subscription-Key", "2d0a247b5db042469d5c6a10bc564199");
    request.setRequestHeader("Ocp-Apim-Trace", "true");
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Accept", "application/json");
    request.send(JSON.stringify(inputPayload));

    button.innerText = 'Posting...';
    button.disabled = true;
    fields.disabled = true;
}