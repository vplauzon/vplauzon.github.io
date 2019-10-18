---
title:  Azure Functions HTTP – Authorization Levels
date:  12/04/2017 11:49:54
permalink:  "/2017/12/04/azure-functions-http-authorization-levels/"
categories:
- Solution
tags:
- API
- Identity
- Security
- Serverless
- Web
---
<a href="assets/2017/12/azure-functions-http-authorization-levels/pexels-photo-2775931.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="pexels-photo-277593[1]" src="assets/2017/12/azure-functions-http-authorization-levels/pexels-photo-2775931_thumb.jpg" alt="pexels-photo-277593[1]" width="320" height="171" align="left" border="0" /></a>In <a href="https://vincentlauzon.com/2017/11/27/serverless-compute-with-azure-functions-getting-started/">a past article</a>, we looked at Serverless compute in Azure in general and Azure Functions specifically.

In this article we wanted to focus on Azure Function triggered by HTTP requests and the different options we have to authenticate:

<ul>
    <li>Anonymous</li>
    <li>Function</li>
    <li>Admin</li>
    <li>System</li>
    <li>User</li>
</ul>

Those are called <em>Authorization Levels</em>.  For each function in a function app they are specified in the <em>function.json</em> spec file under the <em>authLevel</em> property:

<a href="assets/2017/12/azure-functions-http-authorization-levels/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/azure-functions-http-authorization-levels/image_thumb.png" alt="image" border="0" /></a>

When <em>function.json</em> spec file is generated from code, e.g. in <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-your-first-function-visual-studio">Visual Studio for C#</a> or <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-java-maven">Maven for Java</a>, the authorization level is set in code.  For instance, in C#, it is specified in the <em>HttpTrigger</em> attribute:

<a href="assets/2017/12/azure-functions-http-authorization-levels/image1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/azure-functions-http-authorization-levels/image_thumb1.png" alt="image" border="0" /></a>

Let’s look at each of those authorization level.

<h2>Anonymous</h2>

Anonymous means no authentication is required.  Any valid HTTP request passes.

<h2>Function</h2>

<em>Function</em>, <em>Admin</em> &amp; <em>System </em>authorization level are key based.

The online documentation has a <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook#authorization-keys" target="_blank" rel="noopener">good section on authorization keys</a>.

Basically, there are two types of keys:  <strong>host</strong> and <strong>function</strong> keys.  The former is scoped at the function app level while the latter is scoped at the function level (i.e. within a function app).

There is a special host key called the <strong>master</strong> key (aptly named <em>_master</em>).  A master key is always present and can’t be revoked although it can be renewed, i.e. its value can be changed and its older value won’t be accepted anymore.

Keys can be managed in the portal using the <em>Manage</em> sub menu.  Although the context is function specific, we can edit the host keys there too.

<a href="assets/2017/12/azure-functions-http-authorization-levels/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/azure-functions-http-authorization-levels/image_thumb2.png" alt="image" border="0" /></a>

A key can be passed to an Azure Function HTTP request in the URL as the <em>code</em> query string.  Alternatively, it can be included in the <em>x-functions-key</em> HTTP header.  Only the key value, not its name, is passed.

<em>Function </em>authorization level requires a key for authorization.  <strong>Both function and host key will work</strong>. In that sense it is the less restrictive of key-based authorization level.

<h2>Admin</h2>

<em>Admin </em>authorization level requires a <strong>host key </strong>for authorization.

Passing a function key will fail authorization and return an HTTP 401 – Unauthorized error code.

<h2>System</h2>

<em>System </em>authorization level requires the <strong>master key </strong>of a function app for authorization.

Passing a function key or a host key (except the master key) will fail authorization and return an HTTP 401 – Unauthorized error code.

<h2>User</h2>

<em>User </em>authorization level isn’t key based.  Instead it does mandate a valid authentication token.

As of this writing, i.e. early December 2017, it isn’t fully implemented.  We can follow the <a href="https://github.com/Azure/azure-webjobs-sdk-script/issues/33" target="_blank" rel="noopener">feature status with this GitHub issue</a> (the issue refers to <a href="https://easyauth.azurewebsites.net/" target="_blank" rel="noopener">easy-auth</a> which is based on Azure Active Directory).

There are compelling reasons to use a token-based authentication system instead of system-key one.  We will come back to those in a future article.

<h2>Summary</h2>

Azure Functions supports multiple Authorization levels for HTTP requests.  The level can easily be changed by the <em>function.json </em>specification file.

Using those configurations allows the function runtime engine to take care of authorization logic and freeing the function code from that logic.

<strong>Update (23-04-2019):  I would recommend you take a look at my colleague Matt Ruma's blog, <a href="http://www.mattruma.com/secure-an-azure-function-app-with-azure-active-directory/">Secure an Azure Function App with Azure Active Directory</a>, for more details on AAD protecting a function.</strong>