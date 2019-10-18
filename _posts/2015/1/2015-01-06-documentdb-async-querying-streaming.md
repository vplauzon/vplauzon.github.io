---
title:  DocumentDB Async Querying & Streaming
date:  2015-01-07 02:31:41 +00:00
permalink:  "/2015/01/06/documentdb-async-querying-streaming/"
categories:
- Solution
tags:
- .NET
- NoSQL
---
<strong>UPDATE (31-08-2017):  This article is superseded by the new article <a href="https://vincentlauzon.com/2017/08/31/cosmos-db-async-querying-streaming/">Cosmos DB Async Querying &amp; Streaming</a>.</strong>

Working with the .NET client SDK of <a href="http://vincentlauzon.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a>, I couldn't find a way to query the store asynchronously.
<p style="margin-left:36pt;">***This post relates to the version 0.9.1-preview of <a href="http://www.nuget.org/packages/Microsoft.Azure.Documents.Client/0.9.1-preview">Microsoft Azure DocumentDB Client Library</a>. If you work with another major version, this might not be relevant.***</p>
That seemed odd since all the SDK is asynchronous, but when it came to querying, you only could form a LINQ query and once you either iterate on it or called <em>ToArray</em> or <em>ToList</em>¸ your process would block in a synchronous manner.

I was half surprised since asynchrony isn't built into LINQ and must usually be bolted in more or less elegantly. I looked around on the web and couldn't find a solution. I ended up finding it by myself. Most of you probably did too, but for those who haven't yet, here is the solution.
<h2>Why Async?</h2>
Just before I dive in the solution, I just wanted to explain why you would want to implement asynchrony in querying. I keep finding bits on the web indicating that people do not understand why asynchrony is for in .NET so I always think it's worthwhile to discuss it.

Let's try the reverse psychology approach. Here is what asynchrony doesn't bring you:
<ul>
 	<li>It doesn't make you client (e.g. browser) asynchronous ; for instance, if you implement it in a service call, it doesn't make the caller asynchronous (e.g. Ajax)</li>
 	<li>It doesn't bring you performance per se</li>
 	<li>It doesn't make your code run on multiple threads at once</li>
</ul>
Asynchrony allows you to… <strong>SCALE your server code</strong>. It allows you to multiplex your server, to serve more concurrent requests at the same time. <span style="text-decoration:underline;">If you do not have scaling issues, you might not need asynchrony</span>.

The reason why it allows you to scale? When you async / await on an I/O call (e.g. a DocumentDB remote call), it frees the current thread to be used by another request until the call comes back, allowing you to serve more requests with less threads and memory.
<h2>The solution</h2>
A LINQ query to DocumentDB would look something like this:

<em>var query = from doc in _client.CreateDocumentQuery&lt;MyDoc&gt;(documentsLink)
where doc.MyProperty=="My Criteria"
select doc;
var documents = query.ToArray();
</em>

Where _<em>client</em> is an instance of <a href="http://msdn.microsoft.com/en-us/library/azure/microsoft.azure.documents.client.documentclient.aspx"><em>DocumentClient</em></a>. Now if you can't find the method <em>CreateDocumentQuery</em> on that object that is normal. Read <a href="http://vincentlauzon.com/2014/10/19/in-azure-documentdb-documentclient-createdocumentquery-doesnt-exists/">this post</a> to understand why.

As previously mention, the <em>ToArray</em> method call will block synchronously. So how do we modify this to be asynchronous? The full solution is embodied in this helper method:

<em>private static async Task&lt;IEnumerable&lt;T&gt;&gt; QueryAsync&lt;T&gt;(IQueryable&lt;T&gt; query)
{
var docQuery = query.AsDocumentQuery();
var batches = new List&lt;IEnumerable&lt;T&gt;&gt;();</em>

do
{
var batch = await docQuery.ExecuteNextAsync&lt;T&gt;();

batches.Add(batch);
}
while (docQuery.HasMoreResults);

var docs = batches.SelectMany(b =&gt; b);

return docs;
}

You can pass the <em>query</em> variable from previous code snippet to this method since it is an <em>IQueryable&lt;MyDoc&gt;</em>.

The key is in the <em>AsDocumentQuery</em> method. This returns an instance of <em>IDocumentQuery&lt;T&gt;</em> which has asynchronous methods on it.

The beauty of this helper method is that it works for querying documents (<em>CreateDocumentQuery</em>) but also to querying document collection (<em>CreateDocumentCollectionQuery</em>) &amp; databases (<em>CreateDatabaseQuery</em>).
<h2>Streaming</h2>
As a bonus, the generic helper method could easily be modified to allow you to <em>stream</em> your results. This could be useful if your query returns <em>a lot</em> of documents that you do not want to keep in memory at the same time. Basically you would only keep the document of a batch (a service call to DocumentDB) at the time.

Enjoy!