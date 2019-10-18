---
title:  Automating Azure AD
date:  02/02/2017 22:23:22
permalink:  "/2017/02/02/automating-azure-ad/"
categories:
- Solution
tags:
- Automation
- Identity
- Security
---
<a href="assets/2017/2/automating-azure-ad/machine-1651014_1920.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="Automation" src="assets/2017/2/automating-azure-ad/machine-1651014_1920_thumb.jpg" alt="https://pixabay.com/en/machine-factory-automation-1651014/" width="400" height="268" align="right" border="0" /></a>

In the <a href="https://vincentlauzon.com/2017/01/31/using-microsoft-graph-api-to-interact-with-azure-ad/" target="_blank">previous article</a>, we explored how to interact (read / write) to an Azure AD tenant using Microsoft Graph API.

In the <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank">article before that</a>, we looked at how to authenticate a user without using Azure AD web flow.

Those were motivated by a specific scenario:  replacing a LDAP server by Azure AD while migrating a SaaS application to Azure.

Now a SaaS application will typically have multiple tenants or instances.  Configuring Azure AD by hand, like any other Azure service, can be tedious and error prone.  Furthermore, once we’ve onboarded say 20 tenants, making a configuration change will be even more tedious and error prone.

This is why we’ll look at automation in this article.

We’ll look at how to automate the creation of Azure AD applications we used in the last two articles.  From there it’s pretty easy to generalize (aka exercise to the reader!).
<h2>Azure AD Tenant creation</h2>
From the get go, bad news, we can’t create the tenant by automation.

No API is exposed for that, we need to go through the portal.

Sorry.
<h2>Which PowerShell commands to use?</h2>
Automating Azure AD is a little confusing.  Too many options is like not enough.

The <strong>first approach</strong> should probably be to use the <strong>Azure PowerShell package</strong> like the rest of Azure services.  For instance, to create an application, we would use <a href="https://docs.microsoft.com/en-us/powershell/resourcemanager/azurerm.resources/v3.5.0/new-azurermadapplication" target="_blank">New-AzureRmADApplication</a>.

The problem with that package for our scenario is that the Azure AD tenant isn’t attached to a subscription. This is typical for a SaaS model:  we have an Azure AD tenant to manage internal users on all subscriptions and then different tenants to manage external users.  Unfortunately, at the time of this writing, the Azure PowerShell package is tied around the <a href="https://docs.microsoft.com/en-us/powershell/resourcemanager/azurerm.profile/v1.0.12/add-azurermaccount" target="_blank">Add-AzureRmAccount</a> command to authenticate the user ; that command binds a subscription (or via the Select-AzureRmSubscription).  But in our case we do not have a subscription:  our Azure AD tenant isn’t managing a subscription.

The <strong>second approach</strong> would then be to use the <a href="https://docs.microsoft.com/en-us/powershell/msonline/v1/azureactivedirectory?redirectedfrom=msdn" target="_blank">MSOnline Module</a>.  That’s centered around Azure AD, but it is slowly being deprecated for…

The <strong>third approach</strong>, <a href="https://docs.microsoft.com/en-us/powershell/azuread/v2/azureactivedirectory" target="_blank">Azure Active Directory V2 PowerShell module</a>.  This is what we’re going to use.

I want to give a big shout to <a href="http://spr.com/author/chris-d/" target="_blank">Chris Dituri</a> for tapping the trail here.  His article <a href="http://spr.com/azure-active-directory-creating-applications-spns-powershell/" target="_blank">Azure Active Directory: Creating Applications and SPNs with Powershell</a> was instrumental to write this article.  As we’ll see, there are bunch of intricacies about the application permissions that aren’t documented and that Chris unraveled.

The first thing we’ll need to do is to install the PowerShell package.  Easy:

[code language="powershell"]
Install-Module AzureADPreview
[/code]

If you read this from the future, this might have changed, so check out the <a href="https://docs.microsoft.com/en-us/powershell/azuread/v2/azureactivedirectory" target="_blank">documentation page</a> for install instructions.
<h2>Connect-AzureAD</h2>
We need to connect to our tenant:

[code language="powershell"]
connect-azuread -TenantId bc7d0032…
[/code]

You can see the documentation on the <a href="https://docs.microsoft.com/en-us/powershell/azuread/v2/connect-azuread" target="_blank">Connect-AzureAD command here</a>.

Where do we take our tenant ID?

<a href="assets/2017/2/automating-azure-ad/image.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/2/automating-azure-ad/image_thumb.png" alt="image" border="0" /></a>

Now we can go and create applications.
<h2>Service-Client</h2>
Here we’ll replicate the applications we built by hand in the <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank">Authenticating to Azure AD non-interactively</a> article.

Remember, those are two applications, a service and a client one.  The client one has permission to access the service one &amp; let users sign in to it.  As we’ll see, giving those permissions are a little tricky.

Let’s start by the final PowerShell code:

[code language="powershell"]
#  Grab the Azure AD Service principal
$aad = (Get-AzureADServicePrincipal | `
    where {$_.ServicePrincipalNames.Contains(&quot;https://graph.windows.net&quot;)})[0]
#  Grab the User.Read permission
$userRead = $aad.Oauth2Permissions | ? {$_.Value -eq &quot;User.Read&quot;}

#  Resource Access User.Read + Sign in
$readUserAccess = [Microsoft.Open.AzureAD.Model.RequiredResourceAccess]@{
  ResourceAppId=$aad.AppId ;
  ResourceAccess=[Microsoft.Open.AzureAD.Model.ResourceAccess]@{
    Id = $userRead.Id ;
    Type = &quot;Scope&quot;}}

#  Create Service App
$svc = New-AzureADApplication -DisplayName &quot;MyLegacyService&quot; `
    -IdentifierUris &quot;uri://mylegacyservice.com&quot;
# Associate a Service Principal to the service Application 
$spSvc = New-AzureADServicePrincipal -AppId $svc.AppId
#  Grab the user-impersonation permission
$svcUserImpersonation = $spSvc.Oauth2Permissions | `
    ?{$_.Value -eq &quot;user_impersonation&quot;}
 
#  Resource Access 'Access' a service
$accessAccess = [Microsoft.Open.AzureAD.Model.RequiredResourceAccess]@{
  ResourceAppId=$svc.AppId ;
  ResourceAccess=[Microsoft.Open.AzureAD.Model.ResourceAccess]@{
    Id = $svcUserImpersonation.Id ;
    Type = &quot;Scope&quot;}}
#  Create Required Access 
$client = New-AzureADApplication -DisplayName &quot;MyLegacyClient&quot; `
  -PublicClient $true `
  -RequiredResourceAccess $readUserAccess, $accessAccess
[/code]

As promised, there is ample amount of ceremony.  Let’s go through it.
<ul>
 	<li>Line 1:  we grab the service principal that has a <a title="https://graph.windows.net" href="https://graph.windows.net">https://graph.windows.net</a> for a name ; you can check all the service principals living in your tenant with Get-AzureADServicePrincipal ; I have 15 with a clean tenant.  We’ll need the Graph one since we need to give access to it.</li>
 	<li>Line 5:  we grab the specific user read permission inside that service principal’s <em>Oauth2Permissions</em> collection.  Basically, service principals expose the permission that other apps can get with them.  We’re going to need the ID.  Lots of GUIDs in Azure AD.</li>
 	<li>Line 8:  we then construct a user-read <em>RequiredResourceAccess</em> object with that permission</li>
 	<li>Line 15:  we create our Legacy service app</li>
 	<li>Line 16:  we associate a service principal to that app</li>
 	<li>Line 20:  we grab the user impersonation permission of that service principal.  Same mechanism we used for the Graph API, just a different permission.</li>
 	<li>Line 24:  we build another <em>RequiredResourceAccess</em> object around that user impersonation permission.</li>
 	<li>Line 30:  we create our Legacy client app ; we attach both the user-read &amp; user impersonation permission to it.</li>
</ul>
<h2>Grant Permissions</h2>
If we try to run the authentication piece of code we had in the article, we’ll first need to change the “clientID” value for <em>$client.AppId</em> (and make sure <em>serviceUri</em> has the value of "uri://mylegacyservice.com").

Now if we run that, we’ll get an error along the line of

<em>The user or administrator has not consented to use the application with ID '…'. Send an interactive authorization request for this user and resource.</em>

What is that?

There is one manual step we have to take, that is to grant the permissions to the application.  In Azure AD, this must be performed by an admin and there are no API exposed for it.

We could sort of automate it with code via an authentication workflow (which is what the error message is suggesting to do), which I won’t do here.

Basically, an administrator (of the Azure AD tenant) needs to approve the use of the app.

We can also do it, still manually, via the portal as we did in the article.  But first, let’s throw the following command:

[code language="powershell"]
Get-AzureADOAuth2PermissionGrant
[/code]

On an empty tenant, there should be nothing returned.  Unfortunately, there are no Add/New-AzureADOAuth2PermissionGrant at the time of this writing (this might have changed if you are from the future so make sure you check out the available commands).

So the manual step is, in the portal, to go in the MyLegacyClient App, select <em>Required Permissions</em> then click the <em>Grant Permissions</em> button.

<a href="assets/2017/2/automating-azure-ad/image1.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/2/automating-azure-ad/image_thumb1.png" alt="image" border="0" /></a>

Once we’ve done this we can run the same PowerShell command, i.e.

[code language="powershell"]
Get-AzureADOAuth2PermissionGrant
[/code]

and have two entries now.

<a href="assets/2017/2/automating-azure-ad/image2.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/2/automating-azure-ad/image_thumb2.png" alt="image" border="0" /></a>

We see the two permissions we attached to <em>MyLegacyClient</em>.

We should now be able to run the authentication code.
<h2>Graph API App</h2>
Here we’ll replicate the application we created by hand in the <a href="https://vincentlauzon.com/2017/01/31/using-microsoft-graph-api-to-interact-with-azure-ad/" target="_blank">Using Microsoft Graph API to interact with Azure AD</a> article.

This is going to be quite similar, except we’re going to attach a client secret on the application so that we can authenticate against it.

[code language="powershell"]
#  Grab the Azure AD Service principal
$aad = (Get-AzureADServicePrincipal | `
    where {$_.ServicePrincipalNames.Contains(&quot;https://graph.windows.net&quot;)})[0]
#  Grab the User.Read permission
$userRead = $aad.Oauth2Permissions | ? {$_.Value -eq &quot;User.Read&quot;}
#  Grab the Directory.ReadWrite.All permission
$directoryWrite = $aad.Oauth2Permissions | `
  ? {$_.Value -eq &quot;Directory.ReadWrite.All&quot;}


#  Resource Access User.Read + Sign in &amp; Directory.ReadWrite.All
$readWriteAccess = [Microsoft.Open.AzureAD.Model.RequiredResourceAccess]@{
  ResourceAppId=$aad.AppId ;
  ResourceAccess=[Microsoft.Open.AzureAD.Model.ResourceAccess]@{
    Id = $userRead.Id ;
    Type = &quot;Scope&quot;}, [Microsoft.Open.AzureAD.Model.ResourceAccess]@{
    Id = $directoryWrite.Id ;
    Type = &quot;Role&quot;}}

#  Create querying App
$queryApp = New-AzureADApplication -DisplayName &quot;QueryingApp&quot; `
    -IdentifierUris &quot;uri://myqueryingapp.com&quot; `
    -RequiredResourceAccess $readWriteAccess

#  Associate a Service Principal so it can login
$spQuery = New-AzureADServicePrincipal -AppId $queryApp.AppId

#  Create a key credential for the app valid from now
#  (-1 day, to accomodate client / service time difference)
#  till three months from now
$startDate = (Get-Date).AddDays(-1)
$endDate = $startDate.AddMonths(3)

$pwd = New-AzureADApplicationPasswordCredential -ObjectId $queryApp.ObjectId `
  -StartDate $startDate -EndDate $endDate `
  -CustomKeyIdentifier &quot;MyCredentials&quot;
[/code]

You need to “grant permissions” for the new application before trying to authenticate against it.

Two big remarks on tiny bugs ; they might be fixed by the time you read this and they aren’t critical as they both have easy work around:
<ol>
 	<li>The last command in the script, i.e. the password section, will fail with a “<em>stream property was found in a JSON Light request payload. Stream properties are only supported in responses</em>” if you execute the entire script in one go.  If you execute it separately, it doesn’t.  Beat me.</li>
 	<li>This one took me 3 hours to realize, so use my wisdom:  DO NOT TRY TO AUTHENTICATE THE APP BEFORE GRANTING PERMISSIONS.  There seems to be some caching on the authentication service so if you do try to authenticate when you don’t have the permissions, you’ll keep receiving the same claims after even if you did grant the permissions.  Annoying, but easy to avoid once you know it.</li>
</ol>
An interesting aspect of the automation is that we have a much more fine grained control on the duration of the password than in the Portal (1 year, 2 years, infinite).  That allows us to implement a more aggressive rotation of secrets.
<h2>Summary</h2>
Automation with Azure AD, as with other services, helps reduce the effort to provision and the human errors.

There are two big manual steps that can’t be automated in Azure AD:
<ul>
 	<li>Azure AD tenant creation</li>
 	<li>Granting permissions on an application</li>
</ul>
That might change in the future, but for now, that limits the amount of automation you can do with human interactions.