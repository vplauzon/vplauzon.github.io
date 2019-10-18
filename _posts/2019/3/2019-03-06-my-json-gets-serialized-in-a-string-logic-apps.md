---
title:  My JSON gets serialized in a string - Logic Apps
date:  03/06/2019 11:30:58
permalink:  "/2019/03/06/my-json-gets-serialized-in-a-string-logic-apps/"
categories:
- Solution
tags:
- Serverless
---
<img style="float:right;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/11/board-game-business-challenge-277052-e1543612435778.jpg" />

Azure Logic Apps is a powerful tool.

It takes care of long running tasks, retries, bunch of integrations, etc .  .

It also handles JSON payloads natively.  JSON flows in and out of an app.

I recently faced a bit of a problem with JSON though.

My JSON was appearing serialized within a string.  It took me precious minutes to find out why, so I thought I would share this over here.

I had that error while copy-pasting pieces of ARM template code around my Logic App.  This isn't a <em>designer only</em> common mistake.

<a href="https://github.com/vplauzon/logic-apps/tree/master/serialized-json">Code is on GitHub</a>.

<h2>Deploying example</h2>

Let's deploy an example:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Flogic-apps%2Fmaster%2Fserialized-json%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The deployment is trivial as there is no parameters.

It should deploy one Logic Apps named <em>serialization-sample</em>.

<h2>The problem</h2>

Let's simply run the sample app.  We can look at the result:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/result.png" alt="Result" />

We can see that the resulting JSON payload has two properties:

<ul>
<li><em>serialized</em> has a serialized representation of the JSON payload produced by the previous task</li>
<li><em>native</em> has a "native" representation of the JSON payload</li>
</ul>

Typically, we do not want a serialized representation.

<h2>The reason</h2>

Because this sample focus on that problem, it might look obvious, but in the middle of a complicated app, it is harder to find.

If we look at the <em>use-json</em> task definition, we'll have a hint:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/use-json-designer.png" alt="Use json" />

We see that the serialized value is within quote while the native one isn't.

This is confirmed by looking the <a href="https://github.com/vplauzon/logic-apps/blob/master/serialized-json/deploy.json">ARM Template</a>:

[code lang=javascript]
&quot;use-json&quot;: {
    &quot;type&quot;: &quot;Compose&quot;,
    &quot;inputs&quot;: {
        &quot;serialized&quot;: &quot;@{outputs(&#039;compose-some-json&#039;)}&quot;,
        &quot;native&quot;: &quot;@outputs(&#039;compose-some-json&#039;)&quot;
    },
    &quot;runAfter&quot;: {
        &quot;compose-some-json&quot;: [
            &quot;Succeeded&quot;
        ]
    }
}
[/code]

The serialized version has curly braces (i.e. <strong>{}</strong>) around the output while the native one doesn't.

That's it.  Subtle problem but one that can waste the best part of an hour to find when not isolated.

<h2>Summary</h2>

I hope this quick common error scenario is useful.

I wasted about 30 minutes to find that error.  Hopefully you won't have to.