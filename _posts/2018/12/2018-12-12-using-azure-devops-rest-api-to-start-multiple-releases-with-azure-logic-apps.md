---
title:  Using Azure DevOps REST API to start multiple releases with Azure Logic Apps
date:  12/12/2018 11:30:30
permalink:  "/2018/12/12/using-azure-devops-rest-api-to-start-multiple-releases-with-azure-logic-apps/"
categories:
- Solution
tags:
- API
- Automation
- DevOps
- Serverless
---
<img style="float:right;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/11/symphony-orchestra-183608_640-e1543609127507.jpg" />

In our <a href="https://vincentlauzon.com/2018/12/05/using-azure-devops-rest-api-to-start-multiple-releases/">last article</a>, we looked at how we could leverage the <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/?view=azure-devops-rest-5.0">Azure DevOps REST API</a> to trigger multiple releases.

This is useful when rebuilding an environment:  first we release the shared infrastructure then each service on top of it.

In this article, we'll see an implementation example using <a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic Apps</a>.

There are many reasons why I chose Azure Logic Apps:

<ol>
<li>I like it</li>
<li>It rocks</li>
<li>It is serverless:  this isn't frivolous here since I'm using that seldomly at random time</li>
<li>It is great at orchestrating tasks</li>
<li>It has great logging which we can visualize as an overlay on the designer</li>
<li>It is great for interaction with JSON-based REST API</li>
</ol>

There is integration betweeen Logic Apps &amp; Azure DevOps.  Here I'm going to use the REST API directly instead.  I do not like the authentication mechanism of those connectors.  They use delegation from my own account and that delegation must be renewed manually.

The solution I give here is a mere example.  I thought about doing something <em>generic</em> and quickly give up.  The complexity would have defy the purpose.

Our example runs two releases.  It first runs the "top-level" release, wait for its success and then runs the other one.

There are a couple of patterns in the sample I would recommend using for a real solution:

<ul>
<li>Make API call into separate Logic Apps (e.g. get-release) ; this makes the orchestration apps much simpler / cleaner</li>
<li>Grab only a few key elements of the payload to return to orchestration</li>
<li>Do not spread secrets around, pass them (securely) in Logic Apps invocation</li>
</ul>

<a href="https://github.com/vplauzon/devops/tree/master/rest-api-releases">The code is available on GitHub</a>.

<h2>Deploy example</h2>

The sample can easily be deployed by clicking the following button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fdevops%2Fmaster%2Frest-api-releases%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

There are six parameters:

<table>
<thead>
<tr>
  <th>Name</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Pat</td>
  <td>A <a href="https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=vsts">Personal Access Token</a> (PAT) allowing read/write/execute of releases in the DevOps organization</td>
</tr>
<tr>
  <td>Organization</td>
  <td>Name of DevOps organization</td>
</tr>
<tr>
  <td>Top-project</td>
  <td>Name of the top-project, i.e. the project to deploy first</td>
</tr>
<tr>
  <td>Second-project</td>
  <td>Name of the second project, i.e. the one to deploy after the first one succeeded</td>
</tr>
<tr>
  <td>Top-project release definition ID</td>
  <td>The release definition ID of the top-project</td>
</tr>
<tr>
  <td>Second-project release definition ID</td>
  <td>The release definition ID of the second-project</td>
</tr>
</tbody>
</table>

This should deploy very quickly and yield three Logic Apps:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/logic-apps.png" alt="Logic Apps" />

Let's look at each of them.

<h2>Release Orchestration</h2>

This app orchestrates the workflow:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/release-orchestration.png" alt="Release Orchestration" />

It doesn't receive any parameter.  The ARM template pushes its parameters to the Logic Apps parameters.

The workflow is straightforward:

<ol>
<li>Create the top-project release</li>
<li>Grab its release ID</li>
<li>Loop until the release is completed</li>
<li>If the release is a success, it creates the second-project release</li>
</ol>

The loop is quite straightforward itself

<img src="https://vincentlauzon.files.wordpress.com/2018/11/until-top-release-over.png" alt="Until" />

<ol>
<li>Wait for 20 seconds</li>
<li>Get the release status</li>
<li>Parse the result</li>
<li>Grab the result</li>
<li>Run until the status isn't <code>inProgress</code></li>
</ol>

We can run this Logic Apps and it should orchestrate the two releases.

<h2>Create Release</h2>

This app is a thin wrapper around the <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/create?view=azure-devops-rest-5.0">Create Release API</a>.

<img src="https://vincentlauzon.files.wordpress.com/2018/11/create-release.png" alt="Create Release" />

<ol>
<li>Converts the PAT to its base-64 representation, prepending a colon (<strong>:</strong>) to it</li>
<li>Creates the URL for the API</li>
<li>Invoke the API via an HTTP Request</li>
<li>Fails if the API failed</li>
<li>Succeeds if it did succeed, sending a reduced payload</li>
</ol>

<h2>Get Release Status</h2>

Similarly, this app is a thin wrapper around the <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/get%20release?view=azure-devops-rest-5.0">Get Release API</a>.

<img src="https://vincentlauzon.files.wordpress.com/2018/11/get-release-status.png" alt="Get Release Status" />

<ol>
<li>Converts the PAT to its base-64 representation, prepending a colon (<strong>:</strong>) to it</li>
<li>Creates the URL for the API</li>
<li>Invoke the API via an HTTP Request</li>
<li>Fails if the API failed</li>
<li>Succeeds if it did succeed, sending a reduced payload</li>
</ol>

The parsing of the results is slightly more involved here since there is an array. We need specialized tasks for this.

<h2>Summary</h2>

We gave a simple example on how to orchestrate multiple releases using Azure DevOps API.

Leveraging Azure Logic Apps made it quite easy to orchestrate those APIs without writing any code.