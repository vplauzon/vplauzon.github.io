---
title:  Azure Active Directory Application
date:  2016-03-10 14:12:24 +00:00
permalink:  "/2016/03/10/azure-active-directory-application/"
categories:
- Solution
tags:
- Identity
- Security
---
This is a quick post to talk about what an <em>Application</em> is for <a href="https://azure.microsoft.com/en-us/services/active-directory/" target="_blank">Azure Active Directory</a> (or Azure AD or AAD).

If you come from the on premise world and are used to Active Directory on Windows Server, the concept of an application within Active Directory probably is a bit foreign.

Think about how authentication works in the cloud and how it would be without the concept of application.

<a href="assets/2016/3/azure-active-directory-application/image3.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/azure-active-directory-application/image_thumb3.png" alt="image" width="590" height="407" border="0" /></a>

The flow would be that (1) the user authenticates against the identity provider (AAD) and receives an authentication token related only to the user, not the application and (2) the user presents the token to the app.

So that would work.  Except that if the application is an application you don’t fully thrust, for instance a SaaS third party, nothing would stop that app to (3) pass your token to another application, an Enterprise application with sensitive information for instance, and impersonate you.

Clearly, that wouldn’t mean security in the cloud!
<h2>Here comes the Application</h2>
An AAD application fulfills the concept of Relying Party in the claims based model and serves many purposes.

<strong>It limits the context of an authentication to one application</strong>.  It forbids the scenario we just talked about since the token is application-specific.

<strong>It specializes the authentication</strong>.  It allows AAD to emit a different set of claims per application.  AAD standard doesn’t support that yet, but AAD B2C does.

<strong>It makes application (or services) a first class citizen</strong>.  An application isn’t only a relying party which you can, as an end-user, authenticate against ; it is also a <em>Service Principal</em> that can authenticate itself.  In AD on premise, this is usually done using “Service Account”.  AAD made that concept a first class citizen.  You can read <a href="https://vincentlauzon.com/2016/02/04/using-azure-active-directory-service-principal/">Using Azure Active Directory Service Principal</a> to learn more.

With this concept, the authentication flow is augmented as follow.

<a href="assets/2016/3/azure-active-directory-application/image4.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="assets/2016/3/azure-active-directory-application/image_thumb4.png" alt="image" width="588" height="407" border="0" /></a>

Now the user authenticates (1) in the context of a specific application (App X).  It presents the token (2) to App X.  If App X tries to use the token on App Y (3), it gets an unauthorized access since the token isn’t signed for App Y.

So this is what application do in AAD!

&nbsp;

PS:  When I say “the user presents the token”, this is typically done by the browser itself via an HTTP-post on the application.