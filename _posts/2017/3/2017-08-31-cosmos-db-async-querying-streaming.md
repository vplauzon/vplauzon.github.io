---
title: Cosmos DB Async Querying & Streaming
date: 2017-08-31 11:30:06 -07:00
permalink: /2017/08/31/cosmos-db-async-querying-streaming/
categories:
- Solution
tags:
- Data
- NoSQL
---
<img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-223022[1]" src="/assets/posts/2017/3/cosmos-db-async-querying-streaming/pexels-photo-2230221.jpg" alt="pexels-photo-223022[1]" width="400" height="267" align="right" border="0" />I wrote <a href="https://vincentlauzon.com/2015/01/06/documentdb-async-querying-streaming/" target="_blank" rel="noopener">an article</a> back in January 2015 about async querying Azure DocumentDB using the .NET SDK.

The service was still in preview back then.

Since then DocumentDB has been superseded by Azure Cosmos DB and the SDK has changed a bit so I thought I would rewrite that article.  Here it is.

LINQ was built before async into .NET / C#.  That is probably the #1 reason why doing LINQ queries on asynchronously fetched data source is so awkward today.  This will likely change one day but until then…
<h2>Why Async?</h2>
Before we dive in the solution, let’s see why we would want to implement asynchrony in querying.

This was true in 2015 and I hope it is less so today:  a lot of people do not understand why asynchrony is for in .NET.  I always think it’s worthwhile to discuss it.

Let’s try the reverse psychology approach. Here is what asynchrony doesn’t bring us:
<ul>
 	<li>It doesn’t make our client (e.g. browser) asynchronous ; for instance, if we implement it in a service call, it doesn’t make the caller asynchronous (e.g. Ajax)</li>
 	<li>It doesn’t bring us performance per se</li>
 	<li>It doesn’t make our code run on multiple threads at once</li>
</ul>
Asynchrony allows us to… <strong>SCALE our server code</strong>. It allows you to multiplex your server, to serve more concurrent requests at the same time. If we do not have scaling issues, we might not need asynchrony.

The reason it allows us to scale is that when we async / await on an I/O call (e.g. a Cosmos DB remote call), it frees the current thread to be used by another request until the call comes back, allowing us to serve more requests with less threads and memory.
<h2>Solution</h2>
<a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-AsyncQueries/DemoAsyncQuery" target="_blank" rel="noopener">The code is available on GitHub</a>, more specifically in the <a href="https://github.com/vplauzon/cosmos-db/blob/master/Cosmos-DB-AsyncQueries/DemoAsyncQuery/Program.cs" target="_blank" rel="noopener">Program.cs file</a>.

The important part is to recognize that the query object (<em>IDocumentQuery&lt;T&gt;</em>) from the SDK is an asynchronous interface.  It fetches new results in batches.  So we can write a method to fetch all the results like this one:

```csharp
private async static Task<T[]> GetAllResultsAsync<T>(IDocumentQuery<T> queryAll)
{
    var list = new List<T>();

    while (queryAll.HasMoreResults)
    {
        var docs = await queryAll.ExecuteNextAsync<T>();

        foreach (var d in docs)
        {
            list.Add(d);
        }
    }

    return list.ToArray();
}
```

Or one that allows us to process all the items in the query with an <em>action</em>:

```csharp
private async static Task<int> ProcessAllResultsAsync<T>(
    IDocumentQuery<T> queryAll,
    Action<T> action)
{
    int count = 0;

    while (queryAll.HasMoreResults)
    {
        var docs = await queryAll.ExecuteNextAsync<T>();

        foreach (var d in docs)
        {
            action(d);
            ++count;
        }
    }

    return count;
}
```

We can create a query object with no fancy LINQ expression, i.e. basically querying the entire collection, like this:

```csharp
var client = new DocumentClient(new Uri(SERVICE_ENDPOINT), AUTH_KEY);
var collectionUri = UriFactory.CreateDocumentCollectionUri(DATABASE, COLLECTION);
var query = client.CreateDocumentQuery(
    collectionUri,
    new FeedOptions
    {
        EnableCrossPartitionQuery = true
    });
var queryAll = query.AsDocumentQuery();
```

That code basically queries the entire collection and return an array of <em>Document</em> object.

We could also serialize into a custom object and filter the query:

```csharp
var query = client.CreateDocumentQuery<MinimalDoc>(
    collectionUri,
    new FeedOptions
    {
        EnableCrossPartitionQuery = true
    });
var queryNoDog = (from d in query
                    where d.id != "Dog"
                    select d).AsDocumentQuery();
```

In the code sample there are 4 examples using different variations.
<h2>Summary</h2>
Asynchrony is a powerful to scale service-side code.

Cosmos DB allows us to do that in an easy way as was demonstrated in this article.