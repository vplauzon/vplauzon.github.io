---
title:  Nuget Wordpress REST API – Authentication
date:  2015-08-16 19:00:11 -04:00
permalink:  "/2015/08/16/nuget-wordpress-rest-api-authentication/"
categories:
- Solution
tags:
- API
---
<a href="http://vincentlauzon.files.wordpress.com/2015/07/wordpress_logo1.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="wordpress_logo[1]" src="http://vincentlauzon.files.wordpress.com/2015/07/wordpress_logo1_thumb.jpg" alt="wordpress_logo[1]" width="240" height="80" align="left" border="0" /></a>I use <a href="http://wordpress.com/" target="_blank">Wordpress.com</a> as my blog platform.  It hosts the <a href="https://wordpress.org/" target="_blank">Wordpress</a> CMS software and adds a few goodies.

I was curious about their API after noticing that my Blog App (<a href="https://en.wikipedia.org/wiki/Windows_Live_Writer" target="_blank">Windows Live Writer</a>) tended to create duplicate of pictures, leaving lots of unused assets in my Media library.  This really is a personal pet peeve since I’m still at less than %5 of my asset quota after 5 years.

There happens to be two APIs in Wordpress.com.  The old XML RPC API, used by Windows Live Writer actually, and the new <a href="https://developer.wordpress.com/docs/api/" target="_blank">REST API</a>.

The new API is what people would call a modern API:  its authentication is OAuth based, it is RESTful and has JSON payloads.

Surprisingly there didn’t seem to be any .NET client for it.  So I thought…  why not build one?

Enters <a href="https://www.nuget.org/packages/WordpressRestApi/" target="_blank">Wordpress REST API Nuget package</a>.  So far, I’ve implemented the authentication, a get-user and a part of a search-post.

For the search-post, I took the not-so-easy-path of implementing a <a href="https://msdn.microsoft.com/en-us/library/vstudio/bb351562(v=vs.100).aspx" target="_blank"><em>IQueryable&lt;T&gt;</em></a> adapter in order to expose the Post API as a Linq interface.  I’ll write about that but for an heads-up:  not trivial, but it works and is convenient for the client.

I will release the source code soon, but for the moment you can definitely access the <a href="https://www.nuget.org/packages/WordpressRestApi/" target="_blank">Nuget package</a>.

You can trial the client on a site I’m assembling on <a title="https://wordpress-client.azurewebsites.net/" href="https://wordpress-client.azurewebsites.net/">https://wordpress-client.azurewebsites.net/</a>.  <strong><u>Warni</u>ng</strong>:  I do not do web-UI so the look-and-feel is non-existing <img class="wlEmoticon wlEmoticon-winkingsmile" src="http://vincentlauzon.files.wordpress.com/2015/07/wlemoticon-winkingsmile.png" alt="Winking smile" />

Here I’ll give a quick how-to using the client.
<h3>Authentication</h3>
Wordpress.com has the concept of application.  If you’re steep in Claim based authentication, this is what is typically referred to as a <a href="https://en.wikipedia.org/wiki/Relying_party" target="_blank">relying party</a>.  It is also equivalent to an application in <a href="https://msdn.microsoft.com/en-us/library/azure/dn151122.aspx" target="_blank">Azure Active Directory</a>.

You setup application in <a title="https://developer.wordpress.com/apps/" href="https://developer.wordpress.com/apps/">https://developer.wordpress.com/apps/</a>.  The three key information you need in order to get a user to authorize your application to access Wordpress.com are:
<ol>
	<li>Client ID:  provided by Wordpress.com, the identifier of your application</li>
	<li>Client Secret:  also provided by Wordpress.com, a secret it expects you to pass around</li>
	<li>Redirect URL:  provided by you, where Wordpress will send the user back after consent is given</li>
</ol>
Here is the authorization flow:

<a href="http://vincentlauzon.files.wordpress.com/2015/07/image47.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2015/07/image_thumb47.png" alt="image" width="569" height="284" border="0" /></a>
<table style="border-collapse:collapse;border:green 1px solid;">
<thead>
<tr style="color:darkgreen;padding-left:10px;padding-right:10px;background-color:lightgreen;">
<th>#</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>The user clicks on a ‘sign in’ link from your web site.</td>
</tr>
<tr>
<td>2</td>
<td>Your web redirect the user’s browser to a Wordpress.com site passing the client-ID of your application and the return-url you’ve configured.  The URL will be:https://public-api.wordpress.com/oauth2/authorize?client_id=&lt;<em>your value</em>&gt;;redirect_uri=&lt;<em>your value</em>&gt;;response_type=code</td>
</tr>
<tr>
<td>3</td>
<td>Assuming the user consent for your application to use Wordpress.com, the user’s browser is redirected to the <em>Redirect URL</em> you provided to Wordpress.com.  In the query string, your application is given a <em>code</em>.  This code is temporary and unique to that transaction.</td>
</tr>
<tr>
<td>4</td>
<td>Your application can now contact directly (without the browser) the Wordpress.com API to complete the transaction.  You POST a request tohttps://public-api.wordpress.com/oauth2/token

You need to post the code, the client-ID and other arguments.</td>
</tr>
<tr>
<td>5</td>
<td>The API returns you a token you can use for future requests.</td>
</tr>
<tr>
<td>6</td>
<td>For any future request to the API, you pass the token in the HTTP request.</td>
</tr>
</tbody>
</table>
Now, this is all encapsulated in the <a href="https://www.nuget.org/packages/WordpressRestApi/" target="_blank">Wordpress REST API Nuget package</a>.  You still need to do a bit of work to orchestrate calls.

The link to the authorization page you need to redirect the end-user to can be given by:

<span style="font-family:Courier New;">static string <strong>WordpressClient</strong>.GetUserAuthorizeUrl(string appClientID, string returnUrl)</span>

You pass the client-ID of your application and its return-url and the method returns you the URL you need to redirect to user to (step 2).

Then on the return-url page, you need to take the <em>code</em> query string parameter and call

<span style="font-family:Courier New;">static Task&lt;WordpressClient&gt; <strong>WordpressClient</strong>.GetTokenAsync(string clientID, string clientSecret, string redirectURL, string code)</span>

This method is async.  All methods interacting with Wordpress API are async.  The method returns you an instance of the <em>WordpressClient</em> class.  This is the gateway class for all APIs.

That was step 4 &amp; 5 basically.
<h3>Rehydrating a Wordpress Client between requests</h3>
That is all nice and well until your user comes back.  You do not want them to authorize your application at every request.

The typical solution is to persist the token in the user’s cookies so that at each request you can recreate a WordpressClient object.

For that you can access the token information in

<span style="font-family:Courier New;">TokenInfo <strong>WordpressClient</strong>.Token { get; }</span>

When you want to recreate a WordpressClient, simply use its constructor:

<span style="font-family:Courier New;">WordpressClient(TokenInfo token)</span>
<h3>Getting user information</h3>
Just as an example of how to use the API beyond authorization, let’s look at how to get information about the user.

Let’s say the variable <em>client</em> is a <em>WordpressClient</em> instance, then the following line of code

<span style="font-family:Courier New;">var user = await client.User.GetMeAsync();</span>

gets you a bunch of information about your end-user profile on Wordpress.com, such as their display name, the date the user join the site, their email, etc. .  This methods wraps the API operation <a title="https://developer.wordpress.com/docs/api/1.1/get/me/" href="https://developer.wordpress.com/docs/api/1.1/get/me/">https://developer.wordpress.com/docs/api/1.1/get/me/</a>.
<h3>Summary</h3>
This was a quick run around this new <a href="https://www.nuget.org/packages/WordpressRestApi/" target="_blank">Wordpress REST API Nuget package</a> I just created.  I’ll put it on Codeplex soon if you want to contribute.