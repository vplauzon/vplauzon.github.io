---
title:  Authenticating an Azure service principal
date:  2019-05-22 10:30:57 +00:00
permalink:  "/2019/05/22/authenticating-an-azure-service-principal/"
categories:
- Solution
tags:
- Security
---
<a href="https://pixabay.com/illustrations/security-safety-concept-eyes-1163108/"><img style="float:right;padding-right:5px;" title="From pixabay.com" src="https://vincentlauzon.files.wordpress.com/2019/05/security-1163108_640-e1557521297427.jpg" /></a>

When it comes to using Service Principal in Azure, I always advise using <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview">Managed System Identity</a> (MSI).

MSI is simpler and safer.  MSI handles certificate rotations.  We never see the certificate.  Remember this:  the safest secret is the secret you never see.

But in cases we can't use MSI, we are going to give a recipe to do this over HTTP.

<a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-authentication-libraries">There are libraries</a> that pre-packaged that code, but it's one HTTPS post.  Not exactly rocket science.

I realized last week I didn't have that HTTPS POST pattern handy and for some reason it doesn't pop in the top 3 when I search for it...  So, I decided I was going to write a short article so I could search it later!

You are welcome future self!

<strong>Update 22-08-2019:  I realized there was a little error in the use of the API and that the online doc covers it pretty well.  So here is the online doc for <a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-oauth2-client-creds-grant-flow">OAuth v1</a> and <a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow">OAuth v2</a>.</strong>

I'm going to cover only "secret authentication", i.e. not certificate based authentication.

<h2>Parameters</h2>

Here are the parameters we are going to use:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Tenant ID</td>
  <td>Azure AD tenant the Service Principal belongs to ; it's a GUID</td>
</tr>
<tr>
  <td>Audience</td>
  <td>Also called the <strong>scope</strong> or <strong>resource</strong>.  This is what we are going to authenticate against.  If it's an Azure AD application, it can be its application ID.  It can also be a URI.</td>
</tr>
<tr>
  <td>Client ID</td>
  <td>This is the Application ID of the Service Principal</td>
</tr>
<tr>
  <td>Client Secret</td>
  <td>A secret of the application.  Sometimes refer to as a password.</td>
</tr>
</tbody>
</table>

<h2>HTTP POST</h2>

We need something to build an HTTP post.

It could be <a href="https://www.getpostman.com/">Postman</a> or any other tool.  It can be .NET, Java, Python, Go, whatever code.

<h2>HTTP Request</h2>

So here we go.  Ready?

Request (parameters defined above are referred to in {curly braces}):

[code lang=text]
POST https://login.microsoftonline.com/{Tenant ID}/oauth2/v2.0/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
x-ms-version: 2018-11-01
Host: login.microsoftonline.com
content-length: ...

grant_type=client_credentials&amp;scope={Audience}&amp;client_id={Client ID}&amp;client_secret={Client Secret}
[/code]

That's it.

Complicated?

That gives us a response like:

[code lang=text]
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
...
Content-Length: ...

{&quot;token_type&quot;:&quot;Bearer&quot;,&quot;expires_in&quot;:3600,&quot;ext_expires_in&quot;:3600,&quot;access_token&quot;:&quot;VERY_LONG_STRING&quot;}
[/code]

<h2>Using authentication</h2>

Typically, we use the response of the authentication by keeping the token type and access token part of the JSON payload.

We can then use it to authenticate subsequent requests by adding an HTTP header "authentication" with the value "{token type} {access token}".

<h2>Summary</h2>

That's it.  Nice and easy.

But even easier is MSI.  Look it up.