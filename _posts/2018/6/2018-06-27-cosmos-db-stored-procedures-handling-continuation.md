---
title: Cosmos DB Stored Procedures - handling continuation
date: 2018-06-27 06:30:45 -04:00
permalink: /2018/06/27/cosmos-db-stored-procedures-handling-continuation/
categories:
- Solution
tags:
- Data
- NoSQL
---
<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/astronomy-black-wallpaper-constellation-2150.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="astronomy-black-wallpaper-constellation-2150" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/astronomy-black-wallpaper-constellation-2150_thumb.jpg" alt="astronomy-black-wallpaper-constellation-2150" width="320" height="230" align="right" border="0" /></a>I’ve recently did some work involving Stored Procedures in Cosmos DB.

There are a few techniques to learn when our stored procedures handle large data sets.  It is all about continuation.

In this article, we’ll look at how to build a robust and scalable stored procedure.

We’ll start with a naïve approach and then get more sophisticated.

We assume that we are working with a partitioned collection.  Stored procedure execute only in the context of one logical partition.  So what we explore here apply to unpartitioned collections.

As usual, the code used here <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Stored-Proc">is available on GitHub</a>.  We are using <a href="https://github.com/vplauzon/cosmos-db-target-config">cosmos-db-target-config to deploy Cosmos DB artefacts</a>.  We introduce <a href="https://vincentlauzon.com/2018/06/20/cosmos-db-configuration-management/">that solution in a past article</a>.

The Azure Cosmos DB team also has some great <a href="https://github.com/Azure/azure-documentdb-js-server/tree/master/samples/stored-procedures">Stored Procedure sample on GitHub</a>.
<h2>Stored Procedures in Cosmos DB</h2>
Typically we use Stored Procedures in Cosmos DB in 2 scenarios:
<ol>
 	<li>Do bulk write / update / delete.  That’s because SQL query language in Cosmos DB is only for reading.</li>
 	<li>Do fancy queries currently impossible to do with query language.</li>
</ol>
The <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/bulk-executor-overview">newly introduced BulkExecutor library</a> could be an alternative in some of those scenarios.  We won’t cover it in this article.

Stored Procedure runs in the same compute than the database itself.  They therefore benefit from minimal latency.
<h2>Deploying the Azure components</h2>
We can deploy the Azure component by clicking the following button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fcosmos-db%2Fmaster%2FCosmos-DB-Stored-Proc%2FDeployment%2Fazuredeploy.json" rel="nofollow">
<img style="max-width:100%;" src="https://camo.githubusercontent.com/9285dd3998997a0835869065bb15e5d500475034/687474703a2f2f617a7572656465706c6f792e6e65742f6465706c6f79627574746f6e2e706e67" /></a>

This will deploy an Azure Cosmos DB account, a database and a collection.

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image15.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb15.png" alt="image" border="0" /></a>

We took the minimum throughput, 1000 RUs, for a partitioned collection.  The partition key is <em>part</em>.

The deployment also created 4 stored procedures.

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image16.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb16.png" alt="image" border="0" /></a>
<h2>Fill a partition</h2>
We need to run the <em>fillPartition</em> stored procedure to fill a partition with data.

We could use the Portal to invoke the Stored Procedure.  It’s only able to insert 1500-2000 records at the time.  We need 25000.  So we’re going to use the <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Stored-Proc/TestConsoleApp">Console App</a> which simply calls the stored procedure repetitively.

We will need to recover the endpoint and primary key:

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image17.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb17.png" alt="image" border="0" /></a>

and insert it in the constants at the beginning of the code:

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image18.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb18.png" alt="image" border="0" /></a>

We then need to make sure we uncomment the following line of code.

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image19.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb19.png" alt="image" border="0" /></a>

We can now run the code.  It will call the stored procedure several times.  It does so until it has inserted 25000 records in the partition <em>ABC</em>.

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image20.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb20.png" alt="image" border="0" /></a>

We can validate the result by running the following query:

[code language="sql"]
SELECT VALUE COUNT(1)
FROM c
WHERE c.part='ABC'
[/code]

and we should get 25000 as a result.

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image21.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb21.png" alt="image" border="0" /></a>
<h2>Partitioning</h2>
In a <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/partition-data">partitioned collection</a> a stored procedure executes within the context of one logical partition.

When we do call the stored procedure, we actually need to pass the partition key.  For instance, with the .NET SDK we do it with the <a href="https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.documents.client.requestoptions.partitionkey">RequestOptions.PartitionKey property</a>.

For that reason, we do not need to filter / WHERE on the partition key.  A <em>SELECT *</em> would only return elements from the partition.
<h2>Simple Implementation:  a-query-flat.js</h2>
<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/bike-boy-child-1058501.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="bike-boy-child-1058501" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/bike-boy-child-1058501_thumb.jpg" alt="bike-boy-child-1058501" width="320" height="213" align="left" border="0" /></a>Let’s start with a simple implementation.

This is a naïve implementation.  It will act as our baseline.

This implementation queries the entire partition, i.e. <em>SELECT * FROM c</em>.  It scans the entire partition.

It then goes on filtering, in JavaScript for <em>c.oneThird=1</em>.  The <em>oneThird</em> property has been seeded to have one third of record being 1.

It then counts the number of records satisfying that criterium.  Essentially, it is implementing, in JavaScript, the following query:

[code language="sql"]
SELECT VALUE COUNT(1)
FROM c
WHERE c.part='ABC'
AND c.oneThird=1
[/code]

We have a very inefficient implementation on purpose here.  We want to show the effect of paging without having too big a partition for simplicity.

[code language="JavaScript"]
//  Flat query:  simply do the query in a sproc
//
//  We implement a &quot;SELECT * FROM c WHERE c.oneThird=1&quot; by doing a
//  &quot;SELECT * FROM c&quot; and then doing the filtering in code
//
//  Problem:  Although this sproc is simple, it doesn't scale.
//  It only select a page of result and hence won't return a good result
//  if the partition has a few thousand records.
function countOnes() {
    var response = getContext().getResponse();
    var collection = getContext().getCollection();
    var oneCount = 0;

    //  Query all documents
    var isAccepted = collection.queryDocuments(
        collection.getSelfLink(),
        &quot;SELECT * FROM c&quot;,
        {},
        function (err, feed, responseOptions) {
            if (err) {
                throw err;
            }

            if (feed) {
                for (var i = 0; i != feed.length; ++i) {
                    var doc = feed[i];

                    //  Filter document with 'oneThird' == 1
                    if (doc.oneThird == 1) {
                        ++oneCount;
                    }
                }
            }

            //  Return the count in the response
            response.setBody(oneCount);
        });

    if (!isAccepted) {
        throw new Error('The query was not accepted by the server.');
    }
}
[/code]

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image23.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb23.png" alt="image" border="0" /></a>

So what happened here?  Why do we get 33 instead of 8333?

Cosmos DB is a highly scalable database.  It is extremely rigorous in the control of its resource.  One way to do that is to run short queries only.

So when we run the <em>SELECT *</em> query, it doesn’t return the entire content of the partition.  This could take a very long time but also, a lot of memory.  Instead, it returns a feed with a continuation token.

So effectively, what we have done is to query the first page of results.

Let’s query the other pages.
<h2>Continuation token on the server-side:  b-query-continuation.js</h2>
<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/action-adult-athletes-310983.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="action-adult-athletes-310983" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/action-adult-athletes-310983_thumb.jpg" alt="action-adult-athletes-310983" width="320" height="212" align="right" border="0" /></a>Here we are going to call the <em>queryDocuments</em> method multiple times.

Now it isn’t going to be a straight for-loop.  The thing is that Cosmos DB uses continuation pattern.  We do query documents and pass a function to receive those documents once they arrived.  This is the JavaScript equivalent of an async pattern in C# and other languages.

So how can we then call query documents again?  We’ll need something akin to recursion.  Cosmos DB allows us to define functions within functions:

[code language="JavaScript"]
//  Query with continuation:  do the query in a sproc and continue paging the results
//
//  We implement a &quot;SELECT * FROM c WHERE c.oneThird=1&quot; by doing a
//  &quot;SELECT * FROM c&quot; and then doing the filtering in code
//
//  Problem:  Although this sproc implements continuation on the server side and scale
//  better, it won't scale to tens of thousands of records.  Cosmos DB imposes a 5 seconds
//  limit on any query which will force the sproc to stop.  When it does it will throw the
//  the exception at the end of the sproc.
function countOnes() {
    var response = getContext().getResponse();
    var collection = getContext().getCollection();
    var oneCount = 0;

    //  Start a recursion
    query();

    //  Function within the main stored procedure function
    function query(continuation) {
        var requestOptions = { continuation: continuation };
        //  Query all documents
        var isAccepted = collection.queryDocuments(
            collection.getSelfLink(),
            &quot;SELECT * FROM c&quot;,
            requestOptions,
            function (err, feed, responseOptions) {
                if (err) {
                    throw err;
                }

                //  Scan results
                if (feed) {
                    for (var i = 0; i != feed.length; ++i) {
                        var doc = feed[i];

                        //  Filter document with 'oneThird' == 1
                        if (doc.oneThird == 1) {
                            ++oneCount;
                        }
                    }
                }

                if (responseOptions.continuation) {
                    //  Continue the query
                    query(responseOptions.continuation)
                } else {
                    //  Return the count in the response
                    response.setBody(oneCount);
                }
            });

        if (!isAccepted) {
            throw new Error('The query was not accepted by the server.');
        }
    }
}
[/code]

So here we page until we get to the bottom of the feed.

That should do the trick, right?

If we try that in the portal we should get the following result:

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image24.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb24.png" alt="image" border="0" /></a>

We can recognize the text from the exception we throw on the last line of the stored procedure code.

What happened?

We did go through a few pages, but at some point the request for more documents got refused by Cosmos DB engine.  Why?

As stated, Cosmos DB is quite disciplined in the way it manages its resources.  This makes sure that no process is “hugging the CPU” and that performance are predictable.  It forces stored procedure to run under 5 seconds.  It also forbid them to consume too many Request Units (RUs).

For that reason, at some point, the engine blocked the stored procedure.  We then threw because we didn’t know better.

What we would need is to call the stored procedure again to continue processing the results.
<h2>Continuation on the client-side:  c-query-continuation-both-sides.js</h2>
<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/bicycle-bike-cycling-38296.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="bicycle-bike-cycling-38296" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/bicycle-bike-cycling-38296_thumb.jpg" alt="bicycle-bike-cycling-38296" width="320" height="229" align="left" border="0" /></a>Here we have the Stored Procedure implementation continuation itself.

This mechanism isn’t supported natively.  We <strong>implement it as a pattern</strong>.

The stored procedure will return a JSON object.  The object will have 2 properties:  <em>count</em> and <em>continuation</em>.  The former contains the final result when available and <em>null</em> otherwise.  The latter contains a custom continuation token until the final result is available.

So the client-side pattern is to call the stored procedure with no argument at first.  Upon reception of the response, it calls it again, passing the continuation token.  It does so until the final result is available.

The custom token is actually a <em>stringified</em> JSON object.  It contains the “count so far” and the query continuation token.  The “count so far” is the stored procedure internal state.

[code language="JavaScript"]
//  Query with continuation on both sides:  do the query in a sproc and continue paging the results
//  ; the sproc returns continuation token so it can be called multiple times and get around the
//  5 seconds limit.
//
//  We implement a &quot;SELECT * FROM c WHERE c.oneThird=1&quot; by doing a
//  &quot;SELECT * FROM c&quot; and then doing the filtering in code
function countOnes(sprocContinuationToken) {
    var response = getContext().getResponse();
    var collection = getContext().getCollection();
    var oneCount = 0;

    if (sprocContinuationToken) {   //  Parse the token
        var token = JSON.parse(sprocContinuationToken);

        if (!token.countSoFar) {
            throw new Error('Bad token format:  no count');
        }
        if (!token.queryContinuationToken) {
            throw new Error('Bad token format:  no continuation');
        }
        //  Retrieve &quot;count so far&quot;
        oneCount = token.countSoFar;
        //  Retrieve query continuation token to continue paging
        query(token.queryContinuationToken);
    }
    else {  //  Start a recursion
        query();
    }

    //  Function within the main stored procedure function
    function query(queryContinuation) {
        var requestOptions = { continuation: queryContinuation };
        //  Query all documents
        var isAccepted = collection.queryDocuments(
            collection.getSelfLink(),
            &quot;SELECT * FROM c&quot;,
            requestOptions,
            function (err, feed, responseOptions) {
                if (err) {
                    throw err;
                }

                //  Scan results
                if (feed) {
                    for (var i = 0; i != feed.length; ++i) {
                        var doc = feed[i];

                        //  Filter document with 'oneThird' == 1
                        if (doc.oneThird == 1) {
                            ++oneCount;
                        }
                    }
                }

                if (responseOptions.continuation) {
                    //  Continue the query
                    query(responseOptions.continuation)
                } else {
                    //  Return the count in the response
                    response.setBody({ count: oneCount, continuation: null });
                }
            });

        if (!isAccepted) {
            var sprocToken = JSON.stringify({
                countSoFar: oneCount,
                queryContinuationToken: queryContinuation
            });

            response.setBody({ count: null, continuation: sprocToken });
        }
    }
}
[/code]

It is easier to use the C# code to run that stored procedure multiple times.  Let’s make sure we comment back the <em>FillPartitionAsync</em> and uncomment <em>QueryAsync</em>:

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image25.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb25.png" alt="image" border="0" /></a>

The console output should show us the evolution of calls:

<a href="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image26.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2018/6/cosmos-db-stored-procedures-handling-continuation/image_thumb26.png" alt="image" border="0" /></a>

We finally obtain the expected result:  8333.  This took 4 runs of the stored procedure.
<h2>Summary</h2>
We three ways to implement stored procedures.

Although the last one is the most robust, it is also the most complex.

It isn’t always necessary.  If the result set is small enough for the collection throughput, a simpler implementation might work.  For that, we need to know in advance how many records we will scan and how much Request Units (RUs) are going to be available.  If we can’t ascertain those in advance, then the third form is the safest.

There are a lot of variations possible on the third form.  The <em>fillPartition</em> stored procedure we used at the beginning is an example.  It doesn’t return continuation token.  It simply returns the number of records it has inserted.  It is up to the client to call it back and substracting the number of records already inserted.  Another variation would be for a stored procedure deleting records.  It could return the number of records it has deleted and if some records are still available.  The client could call it back and “restart from scratch” since deleted records are no longer there.

The form of the continuation token can also vary.  We chose to stringify a JSON object.  This has the advantage that the client doesn’t need to take in an arbitrary complex object.  We could have base64 it to make it opaque.  In general the continuation token is the internal state of the Stored Procedure but can be formatted in different ways.

We hope this gave you a good background to write robust stored procedure in Cosmos DB.