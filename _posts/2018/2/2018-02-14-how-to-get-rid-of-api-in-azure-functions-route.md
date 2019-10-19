---
title:  How to get rid of /api in Azure Function’s route?
date:  2018-02-14 06:30:39 -05:00
permalink:  "/2018/02/14/how-to-get-rid-of-api-in-azure-functions-route/"
categories:
- Solution
tags:
- API
- Serverless
---
<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/pexels-photo-461901.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-461901" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/pexels-photo-461901_thumb.jpg" alt="pexels-photo-461901" width="320" height="150" align="right" border="0" /></a>We looked at <a href="https://vincentlauzon.com/2017/11/27/serverless-compute-with-azure-functions-getting-started/">Azure Functions</a>.

We also <a href="https://vincentlauzon.com/2017/12/04/azure-functions-http-authorization-levels/">looked at security</a> around Azure Function used to implement APIs.

Something people will quickly notice when implementing an <em>Webhook / API</em>  function is that its URL or <em>route</em> is always prepended by <strong>/api</strong>.

For instance, if we create a webhook function in C# and we setup the route template to “part”:

<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image13.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb13.png" alt="image" border="0" /></a>

we will have a corresponding URL of “https://&lt;FUNCTION APP NAME&gt;.azurewebsites.net/api/part?code=&lt;FUNCTION KEY&gt;”

<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb14.png" alt="image" border="0" /></a>

We did specify the “part”, we didn’t specify “api”.

Now maybe we don’t care or maybe we’ll remap that all using either Azure API Management or Azure Function Proxy, but we like to control our API URLs, so we do care.
<h2>All paths lead to the Host Configuration</h2>
It turns out that prefix is a function app-wide (as oppose to function instance) configuration and is set in <em>host.json</em>.

The schema for this file is <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json">documented here</a> while the <em>http section</em>, the section of the file that interests us, is <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json#http">documented here</a>.  The property <em>http/routePrefix</em> of host.json is set to <em>api</em> by default.

That file can be found in a few ways.  The easiest way there:
<ul>
 	<li>Go to the function application level of the left-hand side menu in the function pane</li>
 	<li>In the <em>Overview</em> top tab, select <em>Function app settings</em><a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image15.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb15.png" alt="image" border="0" /></a></li>
 	<li>This will open a new top tab</li>
 	<li>Find the content of host.json at the bottom of that new tab (scroll down)</li>
</ul>
Alternatively, we could:
<ul>
 	<li style="list-style-type:none;">
<ul><!--StartFragment-->
 	<li>Go to the function application level of the left-hand side menu in the
function pane</li>
 	<li>In the <em>Platform features</em> top tab, select <em>App Service Editor
<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image16.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb16.png" alt="image" border="0" /></a></em></li>
 	<li>This will open a new browser tab with URL <a title="https://fct-vpl.scm.azurewebsites.net/dev/wwwroot/" href="https://&lt;FUNCTION APP NAME&gt;.scm.azurewebsites.net/dev/wwwroot/">https://&lt;FUNCTION APP NAME&gt;.scm.azurewebsites.net/dev/wwwroot/</a></li>
 	<li>We can then easily find host.json under the root
<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image17.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb17.png" alt="image" border="0" /></a></li>
</ul>
</li>
</ul>
<!--EndFragment-->

Finally, for those who like going under the hood, we can go directly in File Storage.  Azure Function uses a storage account, more precisely, they use a File Share within that storage account named after the function app name.  Within that file share, if we go under /site/wwwroot of that share, we’ll find host.json.
<h2>Changing the configuration</h2>
In all cases, we’ll find it empty unless we tempered with it already.

As we mentioned the route prefix default to <em>api</em> so we need to explicitly define it.  In order to have no prefix we can define the host.json file as:

[code language="javascript"]

{
  &quot;http&quot;: {
    &quot;routePrefix&quot;: &quot;&quot;
  }
}

[/code]

If we test the URL again, we’ll see the /api has disappeared.

<a href="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image18.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/how-to-get-rid-of-api-in-azure-functions-route/image_thumb18.png" alt="image" border="0" /></a>
<h2>Summary</h2>
Although the /api prefix seems a mandatory annoyance of working with Azure Function as API, it can easily be removed or modified.