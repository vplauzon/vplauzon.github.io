---
title:  Querying Collections with DocumentDB Studio
date:  11/01/2014 01:48:47
permalink:  "/2014/10/31/querying-collections-with-documentdb-studio/"
categories:
- Solution
tags:
- NoSQL
---
I released a first Release Candidate (RC) of <a href="https://studiodocumentdb.codeplex.com/">DocumentDB Studio</a> (release 1.0.0.1).

<em>DocumentDB Studio is to <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a> what SQL Management Studio is to SQL Server and SQL Azure: a one-stop shop to manage and interact with your DocumentDB.
</em>

I posted an <a href="http://vincentlauzon.com/2014/10/16/installing-documentdb-studio/">installation guide</a> of the application and an <a href="http://vincentlauzon.com/2014/10/22/upgrading-documentdb-studio/">upgrade guide</a> (both very simple).

&nbsp;

In this post I want to walk you through the new features of release 1.0.0.1:
<ul>
	<li>Telemetry</li>
	<li>Load folders before they are selected</li>
	<li>Query collection documents</li>
</ul>
<h1>Load folders before they are selected</h1>
This is a simple user-experience feature.

DocumentDB Studio lazy loads folders. We found that lazy loading a bit in the way of usage so we went a little more eager. When you open a folder, we eager load each sub folder (but no their sub folders).

This gives a more fluid user experience.
<h1>Query collection documents</h1>
The key feature of this release: querying!

In order to query a collection of documents, simply click on a collection folder:

<img src="assets/2014/11/querying-collections-with-documentdb-studio/110114_0226_queryingcol1.png" alt="" />

You can then write any queries. Once you wrote your query, you can either click the red exclamation mark on top of the query text box or press <em>F5</em>.

<img src="assets/2014/11/querying-collections-with-documentdb-studio/110114_0226_queryingcol2.png" alt="" />

For details on how to query DocumentDB see <a href="http://azure.microsoft.com/en-us/documentation/articles/documentdb-sql-query/">this documentation</a>.
<h1>Telemetry</h1>
Let's get the telemetry out of the way. I want to be totally transparent here. Actually the code for telemetry, both client and server is on <a href="https://studiodocumentdb.codeplex.com/">codeplex</a> so if you're into it, you can look it up.

We've added telemetry to the smart client in order to gather intelligence on the scenarios you are using it with in order to orient progress.

We did bend backward in order to keep those telemetries anonymous. Let's look at an example of telemetry entry (yes they are logged in a DocumentDB collection!):
<blockquote>{
"UserID": "nCNquA25eloB2VWHtjaN+oXti+Y=",
"SessionID": "74ab88af-7fe7-402e-a9e8-b4ff8fc08ba1",
"ReleaseVersion": {
"TextVersion": "0.2.1.1"
},
"UpTime": "00:00:00.0312492",
"FeatureCounter": [
{
"Feature": "ViewDocument",
"Count": 10
},
{
"Feature": "QueryDocument",
"Count": 2
}
],
"id": "5c124d49-686f-4cf5-97df-3be372e3b81f"
}</blockquote>
A UserID!? Yes, a user-id. This is a key to aggregate telemetry's entries in order to be able to calculate variation across users.

This isn't the real user-id. Actually, it is a one-way hash of the user login-name and domain-name. A one-way hash means we can't extract back the original user-id. So you are not sending your user-id to our telemetry service.

Session-ID is simply a GUID generated when you launch the app.

The most important part of the telemetry is the feature counter. We count how many times you use different features. This is key to learn what features are used more often.

So no sensitive information (e.g. real user-id) disclosing, simple anonymous statistics.

If you want to learn more, don't hesitate to ask question in the comments section.
<h1>Conclusion</h1>
Querying documents is the key feature of this release and really enable us to explore the Azure DocumentDB product.
<h1>Learn More</h1>
Here are other articles I wrote about <a href="https://studiodocumentdb.codeplex.com/">DocumentDB Studio</a>:
<ul>
	<li><a href="http://vincentlauzon.com/2014/10/22/managing-documents-with-documentdb-studio/">Managing Documents with DocumentDB Studio</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/17/managing-databases-and-collections-with-documentdb-studio/">Managing Databases and Collections with DocumentDB Studio</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/16/creating-an-azure-documentdb-account/">Creating an Azure DocumentDB account</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/15/documentdb-studio/">DocumentDB Studio first (beta) release</a></li>
</ul>
More logistic posts:
<ul>
	<li><a href="http://vincentlauzon.com/2014/10/22/upgrading-documentdb-studio/">Upgrading DocumentDB Studio</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/16/installing-documentdb-studio/">Installing DocumentDB Studio</a></li>
</ul>
Also, here are a couple of posts around <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/http:/vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a> itself:
<ul>
	<li><a href="http://vincentlauzon.com/2014/09/08/azure-documentdb-first-use-cases/">Azure DocumentDB: first use cases</a></li>
	<li><a href="http://vincentlauzon.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Digest: DocumentDB Resource Model and Concepts</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/07/nosql-implementation-concepts/">NoSQL implementation concepts</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/13/profile-of-msn-health-and-fitness-on-azure-documentdb/">Profile of MSN Health and Fitness on Azure DocumentDB</a></li>
	<li><a href="http://vincentlauzon.com/2014/10/19/in-azure-documentdb-documentclient-createdocumentquery-doesnt-exists/">In Azure DocumentDB, DocumentClient.CreateDocumentQuery doesn't exists!</a></li>
</ul>