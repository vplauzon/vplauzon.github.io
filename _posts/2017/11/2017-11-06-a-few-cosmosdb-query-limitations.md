---
title:  A few CosmosDB query limitations
date:  2017-11-06 11:30:56 +00:00
permalink:  "/2017/11/06/a-few-cosmosdb-query-limitations/"
categories:
- Solution
tags:
- NoSQL
---
<a href="assets/2017/11/a-few-cosmosdb-query-limitations/pexels-photo-1645241.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-164524[1]" src="assets/2017/11/a-few-cosmosdb-query-limitations/pexels-photo-1645241_thumb.jpg" alt="pexels-photo-164524[1]" width="320" height="212" align="right" border="0" /></a>I’ve been working quite a bit with Cosmos DB since it was release in Private Preview (see <a href="https://vincentlauzon.com/2014/09/08/azure-documentdb-first-use-cases/">my first article about it back in September 2014</a> as a battle scar).

It has come a long way.

From DocumentDB, the NoSQL document-oriented DB to Cosmos DB, the Globally distributed elastically scalable multi-paradigm DB, the service has done some real progress.

Nowadays, Cosmos DB can be accessed using different APIs.  As of this writing (end of October 2017), the following APIs are available:

<ul>
    <li>Document DB</li>
    <li>Mongo DB</li>
    <li>Gremlin (<a href="https://vincentlauzon.com/2017/08/28/cosmos-db-graph-with-gremlin-getting-started/">graph traversal language</a>)</li>
    <li>Table API (the same API used for Azure Table Storage)</li>
</ul>

Although we create a Cosmos DB account with a target API, we can still use other APIs.  See, for instance, how to <a href="https://vincentlauzon.com/2017/09/05/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/">access a graph in Cosmos DB with SQL / DocumentDB API</a>.  We can also <a href="https://vincentlauzon.com/2017/09/10/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/">change the Portal experience from one API to another</a>.

That is to say that we can use the Document DB API even if the account wasn’t created with that API in mind.

DocumentDB API is also called <em>SQL</em>.  That is because DocumentDB API blends traditional SQL with JavaScript.

And here comes this article.  Although DocumentDB’s SQL looks like SQL and smells like SQL…  it isn’t SQL.

Neither does it pretend to be.  But it’s easy to assume that what work in T-SQL or PSQL will work in DocumentDB SQL.

Here are a few examples of what won’t work.

<h2>Aggregations</h2>

The original DocumentDB SQL didn’t have any aggregation capacity.  But it did acquire those capacities along the way.

Traditionally, that isn’t the strong spot for <a href="https://en.wikipedia.org/wiki/Document-oriented_database" target="_blank" rel="noopener">document-oriented databases</a>.  They tend to be more about find documents and manipulating the documents as oppose to aggregating metrics on a mass of documents.

Today, DocumentDB SQL implements the <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/documentdb-sql-query" target="_blank" rel="noopener">following aggregate</a> functions:

<ul>
    <li>COUNT</li>
    <li>SUM</li>
    <li>MIN</li>
    <li>MAX</li>
    <li>AVG</li>
</ul>

So the following query would return the number of documents in a collection:

[code language="SQL"]

SELECT VALUE COUNT(1)
FROM c

[/code]

The following would give us the minimum age of employees in the HR department:

[code language="SQL"]

SELECT VALUE MIN(c.age)
FROM c
WHERE c.department=&quot;HR&quot;

[/code]

etc.

Now we would expect the following to work quite easily:

[code language="SQL"]

SELECT VALUE MIN(c.age), VALUE MAX(c.age)
FROM c
WHERE c.department=&quot;HR&quot;

[/code]

but it doesn’t.  That isn’t even legal syntax and will be trapped by the client library before it even hits the service.

<strong>UPDATE (30-08-2018):  In the comments Louis remarqued that by removing "VALUE", the query works as is.  That is:  <em>SELECT MIN(c.age), MAX(c.age) FROM c WHERE c.department="HR"</em>.  We do not remember if we tried it when we wrote the article a year ago or not.  Regardless this works today!</strong>

We can only compute an aggregate at the time.

This is quite cumbersome in some scenario since we need to perform two service calls to get two statistics.  Not only does that require more latency but it’s also inefficient because it requires the service to go through the same documents twice.

Hopefully, that will be improved in the future.

<h2>ORDER BY</h2>

The ORDER BY clause is very handy in SQL.  Not only can we sort data in the data engine, but it also allows us to return a smaller dataset when combined with the TOP clause.

Although simple ORDER BYs work well, for instance, the following will return us the employees in the HR department sorted by salary:

[code language="SQL"]

SELECT c
FROM c
WHERE c.department=&quot;HR&quot;
AND c.type=”Employee”
ORDER BY c.profile.salary

[/code]

We could even create something a little more complex by using sub queries:

[code language="SQL"]

SELECT c2.c
FROM
(
SELECT c
FROM c
WHERE c.department=&quot;HR&quot;
AND c.type=”Employee”
) c2
ORDER BY c2.c.profile.salary

[/code]

This might look a little convoluted but in practice sub queries are often used to simplify the query for human readability.

In the end, even if the query contains sub query for human readability, the query processor unroll them and convert them back into a single query.

So we might expect the following to work as well:

[code language="SQL"]

SELECT c2
FROM
(
SELECT c.profile.age*2 AS age, c.profile.salary AS salary
FROM c
WHERE c.department=&quot;HR&quot;
AND c.type=”Employee”
) c2
ORDER BY c2.age

[/code]

After all, we are simply aliasing 2*age for age in a subquery.

Well this doesn’t work.  It returns the following error:

“Unsupported ORDER BY clause. ORDER BY item expression could not be mapped to a document path”

Basically, we are told we can only sort with properties of document, not derived values.

This example might seem a little artificial but we ran against that limitation when <a href="https://vincentlauzon.com/2017/10/25/cosmos-db-performance-with-geospatial-data/">performing performance test on geospatial queries</a>.

One of the test we did in there was to query for documents where a geospatial location (within documents) fell within a polygon.

We noticed the slow query were the one where a lot of documents were within the polygon.  That, even if we didn’t return the documents but simply count them.

Something we tried was to then sort the documents in order of distance from a given point.  The idea was that no application would be interested to get say 60000 documents being inside a polygon but likely, applications would be interested in the documents within that polygon closer to a coordinate (e.g. a mobile user GPS position).

This is where we found that error.  Since the ORDER BY clause had to be done on the return of a function (namely ST_DISTANCE), the query failed.

This limitation exposes a fundamental mechanism of the ORDER BY:  it likely relies on the document index and therefore can’t be performed on non-document-paths.

<h2>Summary</h2>

We showed two types of queries we might think work perfectly fine in Cosmos DB SQL (aka DocumentDB) API but do not.

Those are just two examples but you might find others.

The main idea here is that DocumentDB SQL isn’t T-SQL or PSQL.  It has a lot of what is called a <a href="https://www.thoughtco.com/faux-amis-a-1371225">false friend</a> in linguistic, i.e. something that look like it might work but doesn’t (for instance, in French, the word “actuellement” sounds like it could mean “actually” but does mean “currently”).

For this reason, we recommend that you do test main queries before building an application relying on those, even if it <em>seems </em>those queries <em>really should work out of the box</em>.