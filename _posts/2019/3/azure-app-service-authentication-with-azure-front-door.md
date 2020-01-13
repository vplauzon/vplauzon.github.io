---
title: Azure App Service Authentication with Azure Front Door
date: 2019-07-17 03:30:05 -07:00
permalink: /2019/07/17/azure-app-service-authentication-with-azure-front-door/
categories:
- Solution
tags:
- Networking
- Security
- Web
---
<img style="float:right;padding-left:20px;" title="From pixabay.com" src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/detour-44162_640-e1563313896969.png" />

Last time, we looked at <a href="https://docs.microsoft.com/en-us/azure/frontdoor/front-door-overview">Azure Front Door</a> being used as a reverse proxy in front of <a href="https://docs.microsoft.com/en-us/azure/app-service/overview">Azure App Service</a>.

We are going to increase the difficulty level today by looking at how to implement <a href="https://docs.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad">Azure AD authentication</a>(also called easy auth) in Azure App Service behind Azure Front Door.

Although that seems like an incremental step, there are quite a few challenges due to the multi-tenant nature of Azure App Service.  Basically, if we simply enabled authentication on the web app, the app will go to Azure AD for authentication and come back to the Web App URL, not Azure Front Door URL.  This would of course break the reverse proxy nature of the solution.

In order to do this, we'll need a custom domain name, hence our own DNS.

If you prefer official documentation to my blog, there is some online documentation of this solution around <a href="https://docs.microsoft.com/en-us/azure/application-gateway/troubleshoot-app-service-redirection-app-service-url">Azure Application Gateway</a>.

As usual, <a href="https://github.com/vplauzon/app-service/tree/master/front-door-easy-auth">code is in GitHub</a>.

<h2>The problem</h2>

The problem is quite simple when we think of it.

Azure App Service is a multi tenant service.  This means it hosts several tenants under the same public IP.  The way it's able to route web requests to the proper App Service cluster (tenant) is via the <a href="https://stackoverflow.com/questions/43156023/what-is-http-host-header">HTTP Host Header</a>.

Let's take an example.

When Azure Front Door exposes an endpoint at https://fd-auth.vplauzon.com.azurefd.net, it forwards it to https://vpl-wa-auth.azurewebsites.net.  When Azure App Service receives the requests, it opens the headers and see the host is vpl-wa-auth.azurewebsites.net, which is mapped to our web app.

Now, if we activate Easy Auth with Azure AD, it automatically uses the host header to build its "reply URL", i.e. the URL where Azure AD will post the authentication token.  This is why it breaks the reverse proxy.

<h2>The solution</h2>

First thing we'll do is use an empty host header when we configure the backend in Azure Front Door.  Front Door then defaults the back-end host header to the one in the front-end request.

In order for this to work, Azure App Service would need to be able to map fd-auth.vplauzon.com.azurefd.net to our Web App.  We can do that by adding it as a custom domain...  but it wouldn't work since to validate the domain Azure App Service checks for a CNAME in the DNS of the domain.  Since we do not own azurefd.net, we'll need a custom domain we own.

In the example, we'll use vplauzon.com, which we happened to own.

There is a bit of a hack here since to register a custom domain, we'll need to configure the DNS to point the CNAME at Azure App Service but to register the front end in Azure Front Door, we'll need to point the DNS at Azure Front Door.  This is only required for registration though.

<h2>Deploying the solution</h2>

Before we deploy the solution, we'll need to configure our DNS since Azure Front Door will register the front end with it.  Let's first review the parameters of the <a href="https://github.com/vplauzon/app-service/blob/master/front-door-easy-auth/deploy.json">ARM Template</a>.  There are five.

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th align="center">Mandatory</th>
  <th align="center">Value used in this article</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>customDomain</td>
  <td align="center">X</td>
  <td align="center">fd-auth.vplauzon.com</td>
  <td>The custom domain we are going to use for our front end</td>
</tr>
<tr>
  <td>frontDoorHostPrefix</td>
  <td align="center">X</td>
  <td align="center">vpl-fd-auth</td>
  <td>The DNS prefix for the default front door domain name (in the diagram, that is the 'X' variable)</td>
</tr>
<tr>
  <td>webAppName</td>
  <td align="center">X</td>
  <td align="center">vpl-wa-auth</td>
  <td>The name of the web app, also DNS prefix for its default domain name (in the diagram, the 'Y' variable)</td>
</tr>
<tr>
  <td>webAppSKU</td>
  <td align="center"></td>
  <td align="center"></td>
  <td>Sku of the web app (actually App Service):  <em>Free</em>, <em>Shared</em>, <em>Basic</em> or <em>Standard</em>.  Default to <em>Standard</em> because life is too short.</td>
</tr>
<tr>
  <td>workerSize</td>
  <td align="center"></td>
  <td align="center"></td>
  <td>Size of the App Service:  0 (small), 1(medium), 2(large).  Default to 0 because we won't deploy a real web app.</td>
</tr>
</tbody>
</table>

So in our case, we need to create a CNAME entry mapping the sub domain fd-auth to the domain vpl-fd-auth.azurefd.net.  In Azure DNS Zone, it is done as follow:

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/dns-record-1.png" alt="DNS Record" />

Once we saved that record, we are ready to deploy the template.

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fapp-service%2Fmaster%2Ffront-door-easy-auth%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

<h2>Looking at the solution</h2>

Let's look at what was deployed.

Like last time, we have three resources:  an Azure Front Door, an App Service plan &amp; an App Service.

Let's open the Azure Front Door and look at its designer.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/designer.png" alt="Designer" />

We can see we have two frontend hosts.  The <em>default</em> one, i.e. vpl-fd-auth.vplauzon.com.azurefd.net and the custom one, i.e. fd-auth.vplauzon.com.

If we open the backend pool <em>app-service-pool</em>, we should see it has one host name, i.e. the Azure App Service.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/back-end-host-names.png" alt="back end host names" />

If we select that host name, we can see the <em>backend host header</em> is left empty.  As discussed above, this means it will default to the front-end host.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/host-header.png" alt="Host header" />

There is nothing special about the rest of the deployment.

<h2>Manual steps</h2>

Now let's do some unfortunately necessary manual steps.

<h3>Provision front end certificate</h3>

The first thing we'll do and the one taking the most time (a few minutes) is to register an Azure Front Door managed certificate.  This is free and pretty cool to get started.

<strong>We need to keep the DNS CNAME entry pointing to Azure Front Door while we do this as the CNAME check is used again in the certificate provisioning workflow</strong>.

We'll open the custom domain front-end.  From there, we'll click the <em>Enabled</em> button under <em>Custom Domain HTTPS</em>.  We'll leave <em>Front Door managed</em> as we want Azure Front Door to provision the certificate.  We then click <em>Update</em>.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/certificate.png" alt="Certificate" />

We then save at the designer screen.  This will kickstart the process.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/certificate-process.png" alt="Certificate process" />

<strong>We need to wait until the four steps are green before continuing</strong>.

The screen doesn't update itself, so we need to refresh it.  <strong>This process takes up to 20 minutes</strong>.

<h3>Add custom domain</h3>

<strong>Update 18-07-2019:  This section could be simplified by using an alternate way to prove ownership of domain name detailed <a href="https://docs.microsoft.com/en-us/azure/app-service/manage-custom-dns-migrate-domain#create-domain-verification-record">here</a>.  This allows us not to flip between CNAMEs and make the whole solution simpler but also more</strong>

Let's open the Azure App Service application.  Under <em>Settings</em>, let's select <em>Custom domains</em>.

Let's click <em>Add custom domain</em> and type our custom domain in.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/custom-domain-1.png" alt="Custom domains" />

Before we hit <em>Validate</em>, we need to temporarily change the DNS CNAME to point to Azure App Service's domain (e.g. vpl-wa-auth.azurewebsites.net).  This is only necessary during the validation process.  We suggest doing that in a separate tab and simply undo it (CTRL-Z) once we validated the domain.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/add-custom-domain.png" alt="Add custom domain" />

We can validate.  We need to ensure the host was validated.  Then we can press <em>Add custom domain</em>.

We'll see there is a certificate binding error:

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/binding-error.png" alt="Binding error" />

This is because we didn't upload any certificate for that domain.  This would be difficult as the certificate is bound to Azure Front Door and we do not have access to it.  For a production scenario we would recommend using an external certificate and uploading it both in Azure Front Door &amp; Azure App Service.  This will prompt a few <em>Certificate Error</em> in the browser for us, but this is only a demo.

We can now undo the change on our CNAME record.

<h3>Add authentication</h3>

Let's add authentication to our App Service.

For this we need to go to <em>Authentication / Authorization</em> pane in Azure App Service.

We then choose <em>On</em> under <em>App Service Authentication</em>.

We then change the <em>Action to take when request is not authenticated</em> to <em>Log in with *Azure Active Directory</em>.  This forces every page to have an authenticated user.  It might not be necessary for every app.  Many apps have an opt-in mechanism to authentication, i.e. a <em>sign in</em> button.  But in our case, there really isn't an app underneath, so we'll just force authentication.

We then configure <em>Azure Active Directory</em>:

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/easy-auth.png" alt="Easy auth" />

We'll choose the easy was out.  Let's select <em>Express</em> and keep the default options.

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/azure-ad-app.png" alt="Azure AD App" />

This will create an Azure AD application for us with mostly the right configuration.

We click <em>OK</em>.

At the bottom of the page, we'll enter an <em>Allowed external redirect URL</em>:

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/external-redirect.png" alt="External Redirect" />

The url should be https://CUSTOM_DOMAIN/.auth/login/aad/callback where <em>CUSTOM_DOMAIN</em> is our custom domain.

We then hit <em>Save</em>.

<h2>Testing</h2>

We're finally ready to test.  Let's simply point our browser towards our custom domain.  In our case, that's https://fd-auth.vplauzon.com.

The browser should be redirected to something like:

https://login.microsoftonline.com/TENANT_ID/oauth2/authorize?response_type=code+id_token&amp;redirect_uri=REDIRECT_URI

(and a few other query strings)

The REDIRECT_URI place holder should be our <em>external redirect URL</em> (URL escaped, i.e. with %2f instead of forward slashes).

We should also be prompted with a login screen and a <em>Permissions requested</em> screen.  If we click ok, we should be redirected to our custom domain with the content of an empty Azure App Service:

<img src="/assets/posts/2019/3/azure-app-service-authentication-with-azure-front-door/empty-app.png" alt="Empty app" />

We'll need to hit refresh a few times when we get a certificate error.  Remember, this is because we never uploaded the certificate in the Azure App Service custom domain section.

<h2>Summary</h2>

We did get Azure App Service Authentication to work with Azure Front Door.

It isn't trivial and we hope a better integration will come into the services.

Right now, quite a few manual steps need to be taken as we can't deploy the solution in one go since we need the CNAME DNS to be pointing at different places at different times.