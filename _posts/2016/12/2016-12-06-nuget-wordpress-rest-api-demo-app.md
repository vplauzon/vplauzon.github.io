---
title:  Nuget WordPress REST API – Demo App
date:  2016-12-06 22:40:23 +00:00
permalink:  "/2016/12/06/nuget-wordpress-rest-api-demo-app/"
categories:
- Solution
tags:
- API
---
I’ve had a few requests to explain how to use the <a href="https://vincentlauzon.com/2016/10/17/refactoring-tags-in-wordpress-blog/">Nuget WordPress REST API</a> beyond authentication.

In order to do this, I added a Demo App under source control.

The Nuget package source code is available at <a title="http://wordpressrestapi.codeplex.com/" href="http://wordpressrestapi.codeplex.com/">http://wordpressrestapi.codeplex.com/</a> and if you download the code, you’ll see there are 3 projects:
<ul>
 	<li>WordpressRestApi:  essentially the Nuget package</li>
 	<li>ApiClientTest:  Unit tests on the previous project</li>
 	<li>WordpressDemo:  The new Web App project</li>
</ul>
The demo project shows you a way to use the package.
<h2>Authentication</h2>
Last year I posted an <a href="https://vincentlauzon.com/2015/08/16/nuget-wordpress-rest-api-authentication/">article on WordPress authentication</a>, explaining how it works.  I would first read that article.

When you start the demo, it will take you into a sort of Authentication Wizard when you hit the web app root (e.g. <a title="http://localhost:58373/" href="http://localhost:58373/">http://localhost:58373/</a>).

You need to go to <a href="https://developer.wordpress.com/apps/">https://developer.wordpress.com/apps/</a> and create yourself a WordPress App.  Give it a name &amp; a description.  This is purely to run the demo on your laptop / desktop.  The redirect URL should be of the shape <a href="http://localhost:58373/SignIn">http://localhost:58373/SignIn</a> but where you replaced 58373 by whatever port number the web app run on your laptop.

Once you created the app, at the bottom of the screen you should have access to the two elements of information you’ll need to run the demo.

<a href="assets/2016/12/nuget-wordpress-rest-api-demo-app/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/12/nuget-wordpress-rest-api-demo-app/image_thumb2.png" alt="image" width="1863" height="675" border="0" /></a>

On the demo web site you should be prompted to enter the client ID.

<a href="assets/2016/12/nuget-wordpress-rest-api-demo-app/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/12/nuget-wordpress-rest-api-demo-app/image_thumb3.png" alt="image" width="714" height="790" border="0" /></a>

Usually we would have the Client ID and other app’s information in the web.config.  But to simplify the demo setup, I have the user keypunch them.

Once you’ve enter the client ID, click submit.  The app should give you a link to sign in WordPress.  Click it.

Your browser will have you navigate to <a title="https://public-api.wordpress.com/oauth2/authorize" href="https://public-api.wordpress.com/oauth2/authorize">https://public-api.wordpress.com/oauth2/authorize</a>.  From there, WordPress will request your consent.  Click Approve.

<strong>FYI, the demo App only does read operations:  it won’t modify or delete anything</strong>.

From there you should be brought back to the redirect URL you configured.

<a href="assets/2016/12/nuget-wordpress-rest-api-demo-app/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/12/nuget-wordpress-rest-api-demo-app/image_thumb4.png" alt="image" width="717" height="823" border="0" /></a>

You need to again enter the client ID.  You also need to enter the client secret.

You can the click on the <em>Fetch Token</em> button.  This will allow the web app to fetch a token for the WordPress App.

From there you should land on <a title="http://localhost:58373/DemoRead" href="http://localhost:58373/DemoRead">http://localhost:58373/DemoRead</a>.

You can follow the authentication code from <em>HomeController</em> &amp; <em>SignInController</em> classes (and models).
<h2>Read Operations</h2>
The class <em>DemoReadController</em> does the read operations.  Here we demo a query on posts &amp; one on tags.

Everything flows from the WordpressClient.

We got rid of the tentative of building LINQ queries around WordPress and instead went for a thin interface on top of its REST API.

The surface of the REST API exposed is quite limited at this point:  posts and tags.

A particularity of the interface is the use of IAsyncEnumerable&lt;T&gt;, which is a custom interface allowing us to add a filter (where clause) and / or projection (select).  Those aren’t sent to the API, a la LINQ SQL, but they are at least processed as the objects are hydrated from the requests.  This interface also respects the async semantic hence allowing us to build more scalable application on top of it.
<h2>Summary</h2>
This demo app is by no mean a base for your WordPress applications.  Rather, it illustrates how to use the Nuget Package.

I hope this gives you a better idea on how to use it.