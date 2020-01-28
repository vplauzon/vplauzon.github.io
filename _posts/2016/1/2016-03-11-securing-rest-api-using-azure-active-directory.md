---
title: Securing REST API using Azure Active Directory
date: 2016-03-11 10:00:34 -08:00
permalink: /2016/03/11/securing-rest-api-using-azure-active-directory/
categories:
- Solution
tags:
- API
- Security
---
Scenario:  you have a web &amp; mobile front-end, both using a REST API as a back-end.  You want to secure that back-end with authentication / authorization.  How do you do that in Azure?

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image1.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb1.png" alt="image" width="229" height="375" border="0" /></a>

There are obviously a bunch of ways to do that.  In this post, I’ll discuss the recommended approach:  using Azure Active Directory.  We’ll build an Hello World solution in .NET implementing it.

This is actually quite well documented in the Azure documentation so in this post I’ll just try to complete the documentation with practical points.

You can read about <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-api-apps-why-best-platform/" target="_blank">Azure API apps here</a> and follow a good <em>Getting started</em> <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-api-dotnet-get-started/" target="_blank">tutorial here</a>.  This walks you through building a three tier app, exposes you to the powerful <a href="http://swagger.io/" target="_blank">Swagger</a> integration (you can read about <a href="https://vincentlauzon.com/2014/12/23/description-of-your-rest-api/">Swagger in this post</a>) and the configurations around <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-api-cors-consume-javascript/" target="_blank">Cross-Origin Resource Sharing</a> (CORS).

You can then go about and read <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-api-authentication/" target="_blank">authentication / authorization of API apps here</a>.

I will not cover API Management in this post but once you expose your API publically, i.e. not just to your own services, it’s a good idea to consider <a href="https://azure.microsoft.com/en-us/services/api-management/" target="_blank">Azure API Management</a> to manage it, if only to throttle usage to guarantee a good quality of service to everyone.
<h2>Overview of the solution</h2>
So we’re going to use Azure Active Directory (or Azure AD or AAD) as the identity provider for our solution.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image2.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb2.png" alt="image" width="405" height="403" border="0" /></a>

Now keep in mind there are many variations on this architecture.  There could be a “Web API” within the Web app for AJAX calls.  There could be an <a href="https://azure.microsoft.com/en-us/services/app-service/mobile/" target="_blank">Azure Mobile App</a> API (used by the mobile device only), itself using the API app.  Many other variations.

Here we’ll focus on the architecture pictured in the diagram above.

Notice that the API app is accessed by two classes of identities:
<ul>
 	<li>Service Principal:  the Web app accesses the API as itself, not as the end-user</li>
 	<li>End-User Principal:  the mobile app accesses the API as the end-user</li>
</ul>
This creates an asymmetry within the API app.  For instance, authorization might be a bit funky since the API would trust the service principal to implement authorization rules on its end while it would need to implement it for the end-user.

This is one of the reason why some people might put another API between the mobile app &amp; the back-end API.

In this post, I’ll focus on a Service Principal accessing an API app.

If you are unfamiliar with AAD applications, have a look at <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">Azure Active Directory Application</a> and if you’re unfamiliar with AAD Service Principals, read <a href="https://vincentlauzon.com/2016/02/04/using-azure-active-directory-service-principal/">Using Azure Active Directory Service Principal</a>.
<h2>Let’s build it!</h2>
Ok, let’s go and create a solution.  Let’s call it <em>ApiAuthDemo</em>.

Under that solution, let’s create a ASP.NET application.  I’m using VS 2015 so it might look a little different on other versions of the project.  I choose the ASP.NET Web Application template under the Cloud template folder.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image10.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb10.png" alt="image" width="640" height="198" border="0" /></a>

I call the project <em>AboutMeApi</em>.  I then choose <em>Azure API App</em> sub-template.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image11.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb11.png" alt="image" width="616" height="480" border="0" /></a>

I then create a straight Console App.  This will be the client accessing the API for the demo.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image12.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb12.png" alt="image" width="640" height="270" border="0" /></a>

I call it <em>AboutMeConsole</em>.

So in the end, you should have the following structure in Visual Studio:

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image13.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb13.png" alt="image" width="489" height="480" border="0" /></a>
<h2>About Me API</h2>
Let’s flesh out the API.  And when I say flesh out, I mean let’s change 500 bytes of code.  This is a demo after all!

Under <em>Models</em> folder, create a class <em>PersonaModel</em> with the following code:

```csharp
namespace AboutMeApi.Models
{
    public class PersonaModel
    {
        public string Description { get; internal set; }
        public string Name { get; set; }
        public string[] Claims { get; internal set; }
    }
}
```

Under the <em>Controllers</em> folder rename <em>ValuesController</em> by <em>PersonaController</em>.  This should hopefully rename the underlying class.  Let’s keep the following code:

```csharp
using AboutMeApi.Models;
using System.Linq;
using System.Security.Claims;
using System.Web.Http;

namespace AboutMeApi.Controllers
{
    public class PersonaController : ApiController
    {
        // GET api/values
        public PersonaModel Get()
        {
            var identity = (ClaimsIdentity)User.Identity;
            var claims = from i in identity.Claims
                         select i.Type + " | " + i.Value;

            return new PersonaModel
            {
                Description = "Description of the invoking user",
                Name = identity.Name,
                Claims = claims.ToArray()
            };
        }
    }
}
```

As you can see, what this API does is take the current user information and return it to the caller.

Then under <em>App_Start</em> folder, in <em>SwaggerConfig</em>, uncomment the following:

```csharp
// ***** Uncomment the following to enable the swagger UI *****
})
.EnableSwaggerUi(c =&gt;
{
```

Now we can start the web app to check out our API.  Start it with F5.  You should land on the root of your web site and get a Forbidden 403 error.  That’s because there is no content in the web site, it’s an API.

Go to the Swagger path:  <a title="http://localhost:18008/swagger/" href="http://localhost:18008/swagger/">http://localhost:18008/swagger/</a>.  Actually, my web app is installed on port 18008, yours will be different as it is randomly assigned.

This gives you the beautiful Swagger UI.  You see the Persona API, expend it.  You’ll see the GET operation ; click it.  Then <em>Try it out</em>.  No parameters are required and you should have the following in return payload:

```JavaScript
{ "Description": "Description of the invoking user", "Name": "", "Claims": [] }
```

That is because you aren’t authenticated so the current user is empty.  No problem, we’ll get there.
<h2>Configuring Service Principal in AAD</h2>
Before we build the client test console, we’ll need to be able to authenticate.

For that, we’ll create a Service Principal in AAD.  This will be the identity of the service calling our API ; in our case, the Console Application.

As explained in <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">Azure Active Directory Application</a>, an AAD application is a Service Principal which is the equivalent of a “Service User” in on premise AD, except it is a first class citizen.

Here I will refer you to the excellent article of Tom FitzMacken:  <a href="https://azure.microsoft.com/en-us/documentation/articles/resource-group-create-service-principal-portal/">Create Active Directory application and service principal using portal</a> to create your Service Principal in your AAD with the following properties:
<table border="3" width="1035">
<thead>
<tr style="background:green;color:white;">
<th>Name</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Name</td>
<td>AboutMeConsoleClient</td>
</tr>
<tr>
<td>Sign-on URL</td>
<td><a title="https://console.About.me.com" href="https://console.Aboutme.com">https://console.Aboutme.com</a></td>
</tr>
<tr>
<td>App ID URI</td>
<td><a title="https://console.About.me.com" href="https://console.Aboutme.com">https://console.Aboutme.com</a></td>
</tr>
</tbody>
</table>
You’ll need to create a key and remember its value.  You should also copy the client ID of your Service principal.
<h2>Create API Application in AAD</h2>
This step could be done automatically when deploying your API app in Azure, but I like to see what’s going under the cover…  a little.

So let’s create another app with the following properties:
<table border="3" width="1035">
<thead>
<tr style="background:green;color:white;">
<th>Name</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Name</td>
<td>AboutMeApi</td>
</tr>
<tr>
<td>Sign-on URL</td>
<td><a title="https://console.About.me.com" href="https://api.Aboutme.com">https://api.Aboutme.com</a></td>
</tr>
<tr>
<td>App ID URI</td>
<td><a title="https://console.About.me.com" href="https://api.Aboutme.com">https://api.Aboutme.com</a></td>
</tr>
</tbody>
</table>
We will change some of those properties when we deploy the API to Azure but it’s ok for now.

You do not need to create a key for that application as we will not login to AAD with it but use it only as an application for our Service Principal to log against.  You need to capture the client-ID of the app though.
<h2>Console App</h2>
Now we can build our console app.

First, let’s add a REST API client of the API we just created in the Console app.

Right-click on the Console project, select <em>Add</em>, follow the sub-menu to <em>REST API Client…</em>

You should see the following dialog.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image14.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb14.png" alt="image" width="640" height="402" border="0" /></a>

Since Swagger defines the meta data of your API, it is possible to construct a client for it from that meta data.  This is what this tool does.

Select an existing swagger metadata file &amp; click <em>Browse</em>.  Now you need to tell the system where the swagger file is.  If you go back to the Swagger web page, at the top of the screen you’ll see

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image15.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb15.png" alt="image" width="1979" height="91" border="0" /></a>

So <a title="http://localhost:18008/swagger/docs/v1" href="http://localhost:18008/swagger/docs/v1">http://localhost:18008/swagger/docs/v1</a> is where your swagger metadata file is.  Again, the port number will likely be different on your PC.

Change the namespace for <em>AboutMeConsole.AboutMeApi</em> before hitting <em>OK</em>.

Now you can go in the <em>Program</em> file and paste the following code:

```csharp
using AboutMeConsole.AboutMeApi;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace AboutMeConsole
{
    class Program
    {
        static void Main(string[] args)
        {
            DoJobAsync().Wait();
        }

        private async static Task DoJobAsync()
        {
            var authenticationResult = await AuthenticateAsync();
            var client = new AboutMeApiClient
            {
            };

            client.HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                authenticationResult.AccessToken);

            var persona = await client.Persona.GetAsync();
        }

        private async static Task<AuthenticationResult> AuthenticateAsync()
        {
            var authority = "https://login.microsoftonline.com/<your AAD name here>.onmicrosoft.com";
            //  Invoked App ID
            var resource = "<The client ID of AboutMeApi app>";
            var clientID = "<The client ID of AboutMeConsoleClient app>";
            var clientSecret = "<The secret key of AboutMeConsoleClient app>";
            var clientCredential = new ClientCredential(clientID, clientSecret);
            var context = new AuthenticationContext(authority, false);
            var authenticationResult = await context.AcquireTokenAsync(
                resource,
                clientCredential);

            return authenticationResult;
        }
    }
}
```

You should have a few classes your system doesn’t recognize.  You need to import the NuGet package <em>Microsoft.IdentityModel.Clients.ActiveDirectory</em> to get those classes.

You can then go to the <em>AuthenticateAsync</em> method and replace the placeholder, e.g. &lt;<em>your AAD name here</em>&gt;, by the values you’ve collected.

Now let me explain a bit what the code does here.

First the style:  async.  This is a console app, so async is pretty useless since the main thread is always running, but I like to get everyone in the habit of using await / async for all their code.  So in the main, I do a call to an async method (<em>DoJobAsync</em>) and I wait (block) on it.  This is the only non-async code.  The rest you could copy paste in service code.

So, in <em>DoJobAsync</em> we first fetch a token from AAD, then we create an API client.  On that client we add the access token in the request headers.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image16.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb16.png" alt="image" width="472" height="480" border="0" /></a>

We have the flow described above where the console app goes to AAD, authenticates itself as the console app, in the context of the API app (remember, authentication in AAD always is in the context of a target app).  It receives a bearer token that it passes to the API when invoking it.

Now if you try the console app, you’ll see that the persona object returned by the API is basically empty.  Why is that?

That’s because there is no code in the API app to crack open the token and find the identity of the caller.  We could add ADAL code there and that might be a sensible thing to do in a development environment, but I won’t cover this in this post.

Instead, I’ll leverage the authentication / authorization feature of Azure App Service.
<h2>Deploying the API in Azure</h2>
Let’s publish the API in Azure.  Put it under your favorite App Service Plan &amp; Resource Group.

Try to call the API App name itself <em>AboutMeApi</em>.  But since it needs to be globally unique (being mapped to a DNS), you’ll likely need to append some numbers at the end.  I called mine <em>AboutMeApi2016</em>.

You can then go in the API app in the portal and select the Authentication / Authorization feature.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image17.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb17.png" alt="image" width="362" height="480" border="0" /></a>

This feature is pretty handy.  It basically runs the authentication code outside of your app.  A gateway, in front of your app, intercept the bearer token cracks it open, does the cryptography to check out everything is valid and reemit http-headers your app can readily consume.  Isn’t that fantastic?  If not, what is, I’m asking you.

I definitely suggest you read the <a href="https://azure.microsoft.com/en-us/documentation/articles/app-service-api-dotnet-service-principal-auth/" target="_blank">documentation around service authentication</a> to understand the different options you have.

For us, let’s just switch the authentication to ON, leave the default to “Log in with Azure Active Directory”, then configure the AAD.  For that, select the Express Management mode and then select your app.  If you’re like me and have multiple AAD in your subscription and the AAD you’re using isn’t the default one, select Advanced.

In client ID, paste the client ID of the API app we created earlier.  In Issuer URL, you need to paste <a title="https://sts.windows.net/0e8d8c03-d6cf-4501-98ca-2a2c43db467c/" href="https://sts.windows.net/">https://sts.windows.net/</a> and append the tenant id of your AAD.  To find that out, go to your AAD configuration, select “View Endpoints”

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image18.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb18.png" alt="image" width="160" height="116" border="0" /></a>

Then you should see the ID where I’ve put the orange box.

<a href="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image19.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/1/securing-rest-api-using-azure-active-directory/image_thumb19.png" alt="image" width="821" height="358" border="0" /></a>

You can save your API App configuration in the portal.
<h2>Console App pointing to Azure App</h2>
Now let’s go back to our Console app and change the following code in <em>DoJobAsync</em>:

```csharp
            var client = new AboutMeApiClient
            {
                BaseUri = new Uri("https://aboutmeapi2016.azurewebsites.net")
            };
```

Of course, you need to put your own unique URL there but…  <strong>and I can’t stress that enough</strong>, you need to put HTTPS in your url there.  If you don’t, the authorization feature is going to give you an unauthorized and if you’re lucky like me, you’ll need 3 hours to find out why.  Hint:  it is the letter ‘s’ missing at the end of ‘http’

Now, let’s run the console app.  You’ll see the persona object gets filled with information, including the list of claims given by AAD.

An interesting fact is that your Service Principal doesn’t have a name and this is why the name property is still blank.  Your application is identified by an app-id.
<h2>Token Cache</h2>
I went extremely quickly through the code but an interesting fact is that the object <em>AuthenticationContext</em> contains a property <em>TokenCache</em> which is a global cache in your app-domain.  This means that the next time you call it for an authentication, it won’t go to AAD to fetch a token.

This is gold for performance and scalability of course.

It is clever enough to figure out when the cached token are expiring and will then go again to AAD.
<h2>Conclusion</h2>
Ok, this wasn’t trivial I know.  Lots of GUIDs and configuration right-left &amp; center.

But the important items are:
<ul>
 	<li>You can access an API App using a Service Principal ; this is what you’ll typically do for an API accessed as a “back-end” from another service</li>
 	<li>You can have different Service Principal accessing the same API and you could give different authorization to different ones ; authorization would be done in the code, either declaratively (Authorize attribute) or imperatively</li>
 	<li>Azure App Service can take care of the Authentication / Authorization for you</li>
</ul>
An issue you’ll have in your dev setup, i.e. your own PC while you develop your solution, is that you won’t have the App Service Authentication gateway in front of your service.

You could fix that in different ways.  You could ignore the authentication in dev, knowing it’s taken care of in production.  A bit risky, but you know you could have a flag making sure it’s there in production.  You could put ADAL code in your app and take care of the authentication yourself.  Or you could have a gateway in dev that essentially does the same thing than the one in Azure.  You simply don’t deploy it when you go to Azure.