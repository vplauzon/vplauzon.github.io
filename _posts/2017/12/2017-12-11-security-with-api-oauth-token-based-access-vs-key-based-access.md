---
title:  Security with API: OAuth, token-based access vs key-based access
date:  2017-12-11 06:30:39 -05:00
permalink:  "/2017/12/11/security-with-api-oauth-token-based-access-vs-key-based-access/"
categories:
- Solution
tags:
- API
- Identity
- Security
- Web
---
<a href="http://vincentlauzon.files.wordpress.com/2017/12/pexels-photo-3265691.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-326569[1]" src="http://vincentlauzon.files.wordpress.com/2017/12/pexels-photo-3265691_thumb.jpg" alt="pexels-photo-326569[1]" width="320" height="213" align="right" border="0" /></a>Let’s consider security with APIs, i.e how to securely identify the caller.

There are two authentication methods quite popular in the cloud to secure APIs:
<ol>
 	<li>Key-based access</li>
 	<li><a href="https://en.wikipedia.org/wiki/OAuth" target="_blank" rel="noopener">OAuth</a>, or <a href="https://en.wikipedia.org/wiki/Access_token" target="_blank" rel="noopener">token-based access</a> in general</li>
</ol>
Let’s compare them.
<h2>Key-Based</h2>
By key-based we mean an authentication scheme where we do pass a key to the API request.

That could be in the query string or HTTP header.

Example of key-based authentication in Azure (non exhaustive list):
<ul>
 	<li><a href="https://docs.microsoft.com/en-us/azure/storage/common/storage-rest-api-auth" target="_blank" rel="noopener">Blob REST API</a></li>
 	<li><a href="https://vincentlauzon.com/2017/12/04/azure-functions-http-authorization-levels/" target="_blank" rel="noopener">Function</a></li>
 	<li>Logic Apps</li>
 	<li>Service Bus (via SAS token)</li>
</ul>
<h2>OAuth / Token-based access</h2>
By OAuth we mean <a href="https://en.wikipedia.org/wiki/OAuth" target="_blank" rel="noopener">OAuth</a>.  In general for token-based we mean an authentication mechanism where credentials / secrets are passed to an identity / token-provider which returns a token then pass to relying party / APIs:

<a href="http://vincentlauzon.files.wordpress.com/2017/12/image3.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/12/image_thumb3.png" alt="image" border="0" /></a>

Example of OAuth-based authentication in Azure (non exhaustive list):
<ul>
 	<li>Azure Active Directory (as an identity provider)</li>
 	<li>Data Lake Storage (ADLS) REST API</li>
 	<li>Azure Management REST API</li>
</ul>
<h2>Pros &amp; Cons</h2>
Instead of giving a nice &amp; neatly formatted pros &amp; cons table where all the pros have a corresponding cons, let’s just discuss the major aspects:  security &amp; complexity.

Basically, in general, OAuth is more secure but more complex for both clients (i.e. consumer) and services.

Why is OAuth more secure?  Relying parties never see credentials &amp; secrets in an OAuth authentication scheme.  They see a token.  Token are revoked after a while ; often minutes, maximum a few hours.

By opposition, keys are passed directly to the relying parties.  If they are passed in query strings, they’ll actually be audited.  So it’s much easier for keys to be stolen.  Each API we implement must handle keys and we must make sure that we handle them properly.  We spread the attack surface around.

Also, typically, keys aren’t numerous.  Azure Blob Storage have a primary &amp; secondary key.  We can revoke them but that’s about it.  If more than 2 consumers are using the same account, they need to share the same key.  It gets harder to audit which consumer is using the service.

By opposition OAuth relies on one party handling secrets:  the identity provider.  Typically those are specialized in doing so.  For instance, Azure AD an identity provider and its secret handling has been harden.  Also identity provider typically allow for multiple users / service users / service principles so it’s easier to audit consumers.

On the flip side, we mentioned complexity.  It’s quite easy to see that OAuth is more complicated.  Instead of invoking an API directly, we first need to obtain a token, then we pass this token.  That’s on the consumer side.  On the service side, we need to take this token and validate it.  This often require cryptographic operation which gives headache to the average software engineer.

That complexity can be mitigated by the platform.  For instance, Azure App Service can <a href="https://vincentlauzon.com/2016/03/11/securing-rest-api-using-azure-active-directory/" target="_blank" rel="noopener">completely handle the validation task</a>.
<h2>Summary</h2>
Authentication is a key design aspect of an API.

OAuth should be favoured for its security advantages but keys have a much lower entry point.

It is of course possible to support both, allowing consumers to start with keys to “kick the tyres” and upgrade to OAuth for more serious work.