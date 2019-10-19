---
title:  Authenticating to Azure AD non-interactively
date:  2017-01-29 17:13:09 -05:00
permalink:  "/2017/01/29/authenticating-to-azure-ad-non-interactively/"
categories:
- Solution
tags:
- Identity
- Security
---
<a href="http://vincentlauzon.files.wordpress.com/2017/01/fingerprint-1382652_640.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="fingerprint-1382652_640" src="http://vincentlauzon.files.wordpress.com/2017/01/fingerprint-1382652_640_thumb.jpg" alt="fingerprint-1382652_640" width="192" height="239" align="left" border="0" /></a>I want to use Azure AD as a user directory but I do not want to use its <a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code" target="_blank" rel="noopener">native web authentication mechanism</a> which requires users to go via an Active Directory page to login (which can be branded and customized to look like my own).

I just want to give a user name &amp; password to an authentication API.

The reason is I want to migrate an <em>existing application </em>currently using an LDAP server and want to change the code as little as possible.

You might have other reasons why you want to do that.

Let’s just say that the online literature <strong>HEAVILY </strong>leans towards using the web workflow.  Even the <a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-devquickstarts-ios" target="_blank" rel="noopener">documentation on native apps</a> <strong>recommends</strong> that your native app pops the Azure AD web page to authenticate the user.  There are good reasons for that as this way your app never touches user credentials and is therefore more secure and your app more trustworthy.  So in general, I totally agree with those recommendations.

But in my case, my legacy app is touching the user credentials all over the place.  Also this approach is a stepping stone before considering moving to the web workflow.

After a weekend spent scanning the entire web (<em>as a side note I’ve learned there was little Scandinavian men living </em>inside the Earth<em>, which is </em>flat <em>by the way</em>), I finally found <a href="https://github.com/dstrockis" target="_blank" rel="noopener">Danny Strockis</a>’ article about <a href="https://azure.microsoft.com/en-gb/resources/samples/active-directory-dotnet-native-headless/" target="_blank" rel="noopener">Authenticating to Azure AD non-interactively using a username &amp; password</a>.

That is it basically.  Except the article is a little quick on setup, so I’m gona elaborate here.

I’m going to give a sample in C# using <a href="https://msdn.microsoft.com/en-us/library/azure/mt417579.aspx" target="_blank" rel="noopener">ADAL</a>, but since at the end of the day, the authentication is one HTTP POST, I’ll also give a more bare bone sample using HTTP post if you don’t want or cannot to integrate with ADAL.  The samples are quite trivial so you should be able to convert them in the language / platform of your choice.
<h2>Conceptually</h2>
We basically want our users to interact with our application only, punch in their credentials and have the application check with Azure AD if the credentials are good.

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image15.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb15.png" alt="image" width="420" height="143" border="0" /></a>

Here the application is represented as a Web app here but it could also be a native application.

In order to do this in the world of Azure AD is to use two Azure AD apps:
<ol>
 	<li>A client app, representing the agent authenticating the user</li>
 	<li>A service app, representing the actual application the user is authenticating against</li>
</ol>
I know it looks weird, it makes your brain hurts and is in great part the reason I’m writing this article, because it isn’t straightforward.

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image16.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb16.png" alt="image" border="0" /></a>

In the authentication parlance, the client App is the client (so far so good) while the service app is the resource, i.e. the thing the user is trying to access:  the client is accessing the resource on the user’s behalf.
<h2>Setting up Azure AD</h2>
Yes, there will be some steps to setup Azure AD.

First we need a tenant.  We can use the tenant used by our subscription but typically for those types of scenario we’ll want to have a separate tenant for our end users.  <a href="https://vincentlauzon.com/2016/08/28/azure-active-directory-labs-series-creating-a-tenant/" target="_blank" rel="noopener">This article</a> shows how to create an Azure AD tenant.

We then need a user to test.  We can create a user like this:

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image17.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb17.png" alt="image" border="0" /></a>

where, of course, <em>ldapvpldemo</em> is my Azure AD tenant.

We’ll also need to give that user a “permanent” password, so let’s show the password on creation (or reset it afterwards) then let’s go to an <em>InPrivate browsing</em> window and navigate to <a title="https://login.microsoftonline.com/" href="https://login.microsoftonline.com/">https://login.microsoftonline.com/</a>.  We can then login as the user (e.g. <a href="mailto:test@ldapvpldemo.onmicrosoft.com">test@ldapvpldemo.onmicrosoft.com</a>) with the said password.  We’ll be prompted to change it (e.g. <em>My$uperComplexPassw0rd</em>).

Let’s create the client app.  In <em>App Registrations</em>, let’s add an app with:

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image18.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb18.png" alt="image" border="0" /></a>

It would probably work as a Web app / API but a Native App seems more fitting.

We’ll need the Application ID of that application which we can find by looking at the properties of the application.

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image19.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb19.png" alt="image" border="0" /></a>

We then need to create the service app:

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image20.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb20.png" alt="image" border="0" /></a>

We’ll need the App ID URI of the service:

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image21.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb21.png" alt="image" border="0" /></a>

That URI can be changed, either way we need the final value.

We will need to give permission to the client app to access the service app.  For that we need to go back to the client app, go to the <em>Required Permissions</em> menu and add a permission.  From there, in the search box we can just start to write the name of the service app (e.g. <em>MyLegacyService</em>) and it should appear where we can select it.  We then click the <em>Access MyLegacyService</em> box.

Finally, we need to grant the permissions to users.

<a href="http://vincentlauzon.files.wordpress.com/2017/01/image22.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2017/01/image_thumb22.png" alt="image" border="0" /></a>

With all that, we’re ready to authenticate.
<h2>ADAL</h2>
This sample is in C# / .NET but since ADAL is available on multiple platform (e.g. Java), this should be easy to port.

We’ll create a Console Application project.  We need the full .NET Framework as the .NET core version of ADAL doesn’t have the <em>UserPasswordCredential</em> class we’re gona be using.

We need to install the NuGet package <a href="https://www.nuget.org/packages/Microsoft.IdentityModel.Clients.ActiveDirectory/" target="_blank" rel="noopener">Microsoft.IdentityModel.Clients.ActiveDirectory</a> in the project.

[code language="csharp"]
        private static async Task AdalAuthenticationAsync()
        {
            //  Constants
            var tenant = &quot;LdapVplDemo.onmicrosoft.com&quot;;
            var serviceUri = &quot;https://LdapVplDemo.onmicrosoft.com/d0f883f6-1c32-4a14-a436-0a995a19c39b&quot;;
            var clientID = &quot;b9faf13d-9258-4142-9a5a-bb9f2f335c2d&quot;;
            var userName = $&quot;test@{tenant}&quot;;
            var password = &quot;My$uperComplexPassw0rd1&quot;;

            //  Ceremony
            var authority = &quot;https://login.microsoftonline.com/&quot; + tenant;
            var authContext = new AuthenticationContext(authority);
            var credentials = new UserPasswordCredential(userName, password);
            var authResult = await authContext.AcquireTokenAsync(serviceUri, clientID, credentials);
        }
[/code]

We have to make sure we’ve copied the constants in the constant section.

<strong>UPDATE (06-09-2017):  The name of the constants match the ADAL SDK but doesn't always match what we see on the portal screens.  Here are the constants mapping.  The <em>tenant</em> is the name of your AAD tenant appended by <em>.onmicrosoft.com</em>.  The <em>serviceUri</em> is the <em>App ID URI</em> we collected above (red box).  The <em>clientID</em> is the <em>Application ID</em> we've collected above (red box).  Finally, user name and password belong to the actual user we want to authenticate.</strong>

This should work and <em>authResult</em> should contain a valid <em>access token</em> that we could use as a bearer token in different scenarios.

If we pass a wrong password or wrong user name, we should obtain an error as expected.
<h2>HTTP POST</h2>
We can use <a href="http://www.telerik.com/fiddler" target="_blank" rel="noopener">Fiddler</a> or other HTTP sniffing tool to see what ADAL did for us.  It is easy enough to replicate.

[code language="csharp"]
        private static async Task HttpAuthenticationAsync()
        {
            //  Constants
            var tenant = &quot;LdapVplDemo.onmicrosoft.com&quot;;
            var serviceUri = &quot;https://LdapVplDemo.onmicrosoft.com/d0f883f6-1c32-4a14-a436-0a995a19c39b&quot;;
            var clientID = &quot;b9faf13d-9258-4142-9a5a-bb9f2f335c2d&quot;;
            var userName = $&quot;test@{tenant}&quot;;
            var password = &quot;My$uperComplexPassw0rd&quot;;

            using (var webClient = new WebClient())
            {
                var requestParameters = new NameValueCollection();

                requestParameters.Add(&quot;resource&quot;, serviceUri);
                requestParameters.Add(&quot;client_id&quot;, clientID);
                requestParameters.Add(&quot;grant_type&quot;, &quot;password&quot;);
                requestParameters.Add(&quot;username&quot;, userName);
                requestParameters.Add(&quot;password&quot;, password);
                requestParameters.Add(&quot;scope&quot;, &quot;openid&quot;);

                var url = $&quot;https://login.microsoftonline.com/{tenant}/oauth2/token&quot;;
                var responsebytes = await webClient.UploadValuesTaskAsync(url, &quot;POST&quot;, requestParameters);
                var responsebody = Encoding.UTF8.GetString(responsebytes);
            }
        }
[/code]

Basically, we have an HTTP post where all the previous argument are passed in the POST body.

If we pass a wrong password or wrong user name, we should obtain an error as expected.  Interestingly, the HTTP code is 400 (i.e. bad request) instead of some unauthorized variant.
<h2>Summary</h2>
Authenticating on an Azure AD tenant isn’t the most recommended method as it means your application is handling credentials whereas the preferred method delegate to an Azure AD hosted page the handling of those credential so your application only see an access token.

But for a legacy migration for instance, it makes sense.  Azure AD definitely is more secure than an LDAP server sitting on a VM.

We’ve seen two ways to perform the authentication.  Under the hood they end up being the same.  One is using the ADAL library while the other uses bare bone HTTP POST.

Keep in mind, ADAL does perform token caching.  If you plan to use it in production, you’ll want to configure the cache properly not to get strange behaviours.