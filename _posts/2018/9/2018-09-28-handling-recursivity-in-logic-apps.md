---
title:  Handling recursivity in Logic Apps
date:  2018-09-28 06:30:21 -04:00
permalink:  "/2018/09/28/handling-recursivity-in-logic-apps/"
categories:
- Solution
tags:
- Integration
- Serverless
---
<img style="float:left;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/09/russian-1090697_640-e1538056165145.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic Apps</a> is a powerful integration platform.

Some workflows naturally land themselves to <a href="https://en.wikipedia.org/wiki/Recursion">recursion</a>.  For instance, handling a hierarchical data structure often has a natural recursive solution.

Azure Logic Apps doesn't allow recursion directly.  It forbids a Logic App invoking itself.

In this article we are going to explore two avenues to deal with recursion in Logic Apps:

<ol>
<li>Using a simple indirection to work around the limitation.</li>
<li>Flattening the hierarchy to run everything in one Logic App Instance.</li>
</ol>

As usual, source code is in <a href="https://github.com/vplauzon/logic-apps/tree/master/recursion">GitHub</a>.

<h2>Recursing with Parent-Child</h2>

The first approach consists in working around the direct recursion.

Instead of having a Logic App calling itself, we have it (the <em>parent</em>) call another Logic App (the <em>child</em>) that call it back.

<img src="https://vincentlauzon.files.wordpress.com/2018/09/recursion.png" alt="Recursion" />

Let's look at an example:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Flogic-apps%2Fmaster%2Frecursion%2Fparent-child%2Fdeploy-parent-child.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

<h3>ARM Template</h3>

The ARM template is a little tricky since we have a circular reference.

To work around that, we deploy both Logic Apps twice.  First, we deploy an trivial empty version of each.  We then deploy both complete versions.  With the second deployment, each app exists, so they can reference each other.

We can't deploy the same resource twice in the same ARM template.  We accomplish this double deployment by using a <em>deployment</em> resource (<em>Microsoft.Resources/deployments</em>).  It points to another <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/parent-child/deploy-parent-child-init.json">ARM template</a> which does the <em>init</em> deployment.

<h3>Testing the example</h3>

We have two logic apps:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/parent-app.png" alt="parent-app" />

<ol>
<li>Let's select the <em>parent-app</em> and go to its designer view</li>
<li>Let's open the trigger <em>When a HTTP request is received</em></li>
<li>We can copy its <em>HTTP POST URL</em>
<img src="https://vincentlauzon.files.wordpress.com/2018/09/copy-url.png" alt="Url" /></li>
</ol>

The URL is obviously unique to the Logic App.

In order to test the apps, we need to do an HTTP POST.  Different tool can be used, such as <a href="https://curl.haxx.se/">CURL</a> or <a href="https://www.getpostman.com/">Postman</a>.

The HTTP body must conform to a <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/parent-child/schema.json">simple schema</a>.  Let's use the following content:

```JavaScript
{
    "iterations": 3
}
```

We should obtain the following:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/post-parent-child.png" alt="HTTP Post" />

The response is <code>3, 2, 1, Done!</code>.  This is computed using recursion to illustrate our point.

<h3>Logic Apps Implementation</h3>

Let's look at the Parent App.  This is quite straight forward:

<ul>
<li>We first parse the payload using the <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/parent-child/schema.json">simple schema</a></li>
<li>We then check if the <em>iterations</em> value is greater than zero (0)

<ul>
<li>If it is greater than zero, we call the child logic app with <em>iterations - 1</em>, we then return the current iteration and append ", " and the return of the child app</li>
<li>Otherwise, we return "Done!"</li>
</ul></li>
</ul>

This is a typical recursive algorithm.

The child app is trivial:  it calls the parent logic app, passing the input payload.

<h3>Monitoring</h3>

We can easily monitor.  Let's look at the <em>parent-app</em>:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/parent-child-history.png" alt="History" />

The was 4 runs.  The first received 3, then 2, then 1, then 0.

<h2>Flattening the recursion</h2>

Let's look at how we could run everything in one Logic App.

The example we are going to take is something that receives a hierarchical payload.  This is for simplicity:  the hierarchy could have come from a file, a database, a service, etc.  .

The <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/flat/input.json">payload should look like</a>:

```JavaScript
[
    {
        "name": "master-1",
        "children": [
            {
                "name": "child-1-A",
                "children": [
                    {
                        "name": "child-1-A-I",
                        "children": [
                            {
                                "name": "child-1-A-I-Alpha",
                                "children": []
```

The schema is <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/flat/schema.json">available here</a>.

Our strategy is to implement and <em>until</em> loop.  We start with the <em>root</em> nodes.  We use variables to accumulate the children of those nodes for the next loop.

<h3>Testing the example</h3>

Let's deploy the example:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Flogic-apps%2Fmaster%2Frecursion%2Fflat%2Fdeploy-flat.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

This deploys one Logic App:  <em>flatening-logic-app</em>.

As for the first example, we'll grab the URL.

We can then test the URL with a <a href="https://github.com/vplauzon/logic-apps/blob/master/recursion/flat/input.json">non-trivial</a>:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/post-flat.png" alt="Post flat" />

We can see the output is a simple JSON where the <em>processed</em> property contains all the nodes of the input payload in a <em>breadth first</em> order.

<h3>Logic Apps Implementation</h3>

The implementation contains a few actions but is quite simple.  In pseudo code it would look like this:

```csharp
parse-payload = Parse(Payload)

return-array = []
current-items = parse-payload
next-items = []

Until(current-items is not empty)
   next-items = []
   foreach i in current-items
      return-array.Append(i.name)
      foreach c in i.children
         next-items.Append(c)
   current-items = next-items

return return-array
```

No magic here:  we unfold a hierarchical data structure in a loop.

Notice that we added "debug" actions where we capture the value of a variable for later troubleshooting.

<h3>Monitoring</h3>

Now if we look at the monitoring, we obviously have only one run per invocation:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/flat-history.png" alt="Flat History" />

<h3>Variation</h3>

This example doesn't cover all the recursion cases.  It is a typical example, but different scenarios would call for different solutions.

<h2>Pros &amp; Cons</h2>

If we contrast both approaches we could do a pros &amp; cons.

For the parent-child approach:

<ul>
<li>Pros:

<ul>
<li>Essentially keep the recursion intact</li>
<li>Each run is relatively simple since it typically handles only one data node</li>
</ul></li>
<li>Cons:

<ul>
<li>Require the Logic App to have an HTTP trigger ; this might force exposing a Logic App that wouldn't otherwise (e.g. scheduled)</li>
<li>Monitoring is spread on a range of runs ; this might be tricky if multiple instances are invoked at the same time as runs will overlap</li>
</ul></li>
</ul>

For the flat approach:

<ul>
<li>Pros:

<ul>
<li>Doesn't require the Logic App to be exposed via HTTP</li>
<li>Monitoring has a one invocation / one run unity</li>
</ul></li>
<li>Cons:

<ul>
<li>Add complexity (until loop + variables) in the implementation</li>
<li>Troubleshooting can be tricky as each run as a lot of data in them and it can be tricky to find the information in the loops</li>
</ul></li>
</ul>

For us, there is no right or wrong approach.  It really depends on the scenario.

<h2>Summary</h2>

We looked at two different ways to handle recursion in Logic Apps:

<ol>
<li>We can keep the recursion and implement a parent-child pattern to get around the non-self call rule.</li>
<li>Implement the recursion in loops within the same Logic App</li>
</ol>