---
title:  Serverless compute with Azure Functions - Getting Started
date:  2017-11-27 06:30:39 -05:00
permalink:  "/2017/11/27/serverless-compute-with-azure-functions-getting-started/"
categories:
- Solution
tags:
- Serverless
---
<a href="assets/2017/11/serverless-compute-with-azure-functions-getting-started/halloween-2742991_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="halloween-2742991_640" src="assets/2017/11/serverless-compute-with-azure-functions-getting-started/halloween-2742991_640_thumb.jpg" alt="halloween-2742991_640" width="320" height="240" align="right" border="0" /></a>I meant to write about Azure Functions &amp; serverless computing for quite a while now.  So here we go.

This entry is meant as a “getting started” entry with pointers to documentation and general discussion.  We’ll dive deeper in future articles.
<h2>Serverless</h2>
What is <a href="https://en.wikipedia.org/wiki/Serverless_computing" target="_blank" rel="noopener">serverless computing</a>?

It doesn’t mean, as this blog’s introduction image suggests, that our code runs in <a href="https://en.wikipedia.org/wiki/Aether_(classical_element)" target="_blank" rel="noopener">æther</a>.  Code still runs on servers at the end of the day.

In general, serverless refers to an economical model where we pay for compute resources used as opposed to “servers”.

Wait…  isn’t that what the Cloud is about?

Well, yes, on a macro-scale it is, but serverless brings it to a micro-scale.

In the cloud we can provision a VM, for example, run it for 3 hours and pay for 3 hours.  But we can’t pay for 5 seconds of compute on a VM because it won’t have time to boot.

A lot of compute services have a “server-full” model.  In Azure, for instance, a Web App comes in number of instances.  Each instance has a VM associated to it.  We do not manage that VM but we pay for its compute regardless of the number of requests it processes.

In a serverless model, we pay for micro-transactions.
<h2>Serverless in Azure</h2>
Azure Functions are at the center of serverless discussion in Azure, but they aren’t the only serverless service by any stretch.

The <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-compare-logic-apps-ms-flow-webjobs" target="_blank" rel="noopener">online documentation</a> does a thorough comparison between Azure Functions, Flow, Logic Apps &amp; WebJobs.

Other services are also serverless.  Here is a non-comprehensive list:
<ul>
 	<li>DataLake Analytics:  Big Data as a Service</li>
 	<li>Azure Storage:  pay-per-query service</li>
 	<li>Azure Automation:  pay-per-runbook-run service</li>
 	<li>Data Factory:  Data integration service</li>
 	<li>Traffic Manager</li>
 	<li>Azure DNS</li>
 	<li>etc.</li>
</ul>
<h2>Azure Functions</h2>
We can learn about Azure Function with the <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview" target="_blank" rel="noopener">online documentation</a>.

As a quick aside, although Azure Function is the poster kid for serverless in Azure, it is also possible to have dedicated compute to run Azure Functions.  Serverless works with “consumption” App Service Plans, where we pay for micro transactions, while dedicated works with traditional App Service Plan.

At the time of this writing (end of November 2017), Azure Functions fully support the following language:
<ul>
 	<li>JavaScript</li>
 	<li>C#</li>
 	<li>F#</li>
</ul>
The following languages aren’t Generally Available (GA) but can be used with Azure Functions:
<ul>
 	<li>Java</li>
 	<li>Python</li>
 	<li>PHP</li>
 	<li>TypeScript</li>
 	<li>Batch (.cmd, .bat)</li>
 	<li>Bash</li>
 	<li>PowerShell</li>
</ul>
All those language are supported in a scripting capacity.  C# &amp; Java can now be used in a compiled mode where entire packages can easily be deployed to Azure Functions using development tools:  <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-your-first-function-visual-studio" target="_blank" rel="noopener">Visual Studio for C#</a> &amp; <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-java-maven" target="_blank" rel="noopener">Maven for Java</a>.

Both Windows and Linux can host the platform in Azure.  It is also <a href="https://github.com/azure/azure-webjobs-sdk-script" target="_blank" rel="noopener">Open Sourced on GitHub</a> and can be deployed on premise (it is also available on Azure Stack).

Functions are triggered by events:  HTTP request, Schedule (timer), Blob added to a Blob container, Message arrived to an Azure queue / Service Bus queue / Topic, third party webhook, etc.  .

A strength of Functions is their bindings.  Not only can an event trigger a function, but the runtime takes care of the connectivity with the event’s service.  For instance, when a is added to a blob container, it triggers a function using a blob-binding which means the function directly has access to the blob without using the Azure Storage SDK.  This makes Azure Functions free of a lot of plumbing that plague integration solutions.

Binding can be in input as we just discussed, but they can also be in output.  A function could react to a blob being added by sending a message to a Service Bus topic.  The topic would be accessed using binding, again freeing the function’s code from dealing with the details of Service Bus SDK.
<h2>Where to use</h2>
Now that we discussed some general aspects of Azure Functions, let’s discuss where they are a good fit.
<h3>Event based programming</h3>
An obvious sweet spot is event processing.

Typical event processing implementation have 2 agent instances monitoring a queue to process messages.

That approach has two weaknesses:
<ol>
 	<li>When we process few messages, our solution isn’t efficient economically since our agents (e.g. VMs) are sitting incurring while doing little work.</li>
 	<li>If we have a spike of messages higher than our agents can process, we will need to wait for the agents to process them.</li>
</ol>
Azure Functions address both of those weakness:
<ol>
 	<li>If there are no messages to process, there are no costs</li>
 	<li>When a surge of messages will come, Azure Functions will provision multiple resources to handle the load</li>
</ol>
Azure Functions scale naturally.
<h3>Short processing</h3>
A solution often contain little bits of logic ran either seldomly or on schedule ; e.g. periodically clean-up this data, poke that service for news, etc.  .  We often do not know where to put that logic, especially when we take High Availability into account.  Ever considered how to implement a scheduler that needs to run at 12:00 when you have a cluster of 2 VMs (with no guarantee that either of them is up, but that the <em>cluster is up </em>with %99.95 SLA)?

Azure Functions is a great solution for those bits of logics.
<h3>Integration</h3>
Azure Functions is great at integrating with Azure native services but also external services.
<h3>As a part of Logic Apps</h3>
Azure Functions can also be part of a Logic Apps workflows.  Logic Apps are great for orchestration but fall short when it comes to fine grain compute, for instance manipulating an image, a string, etc.  .  Azure Functions can take care of that fine grain logic with all the power of expression of general language such as C# and JavaScript.
<h3></h3>
<h3></h3>
<h2>Summary</h2>
Azure Functions are a key serverless offering in Azure and a strong integration platform.

Its economical model (micro pay-per-use) makes it an appealing service for scalable solution.