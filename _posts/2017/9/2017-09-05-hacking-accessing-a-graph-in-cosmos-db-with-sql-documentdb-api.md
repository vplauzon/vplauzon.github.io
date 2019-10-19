---
title: 'Hacking: accessing a graph in Cosmos DB with SQL / DocumentDB API'
date: 2017-09-05 06:00:25 -04:00
permalink: /2017/09/05/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/
categories:
- Solution
tags:
- Data
- NoSQL
---
<a href="/assets/2017/9/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/pexels-photo-2646351.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="pexels-photo-264635[1]" src="/assets/2017/9/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/pexels-photo-2646351_thumb.jpg" alt="pexels-photo-264635[1]" width="400" height="267" align="left" border="0" /></a>Azure Cosmos DB is Microsoft’s globally distributed multi-model database service.

At this point in time (August 2017) there are four supported models:  DocumentDB (also named SQL because the query language is similar to T-SQL), MongoDB, Tabular &amp; Gremlin.

<a href="https://vincentlauzon.com/2017/08/28/cosmos-db-graph-with-gremlin-getting-started/" target="_blank" rel="noopener">We’ve seen how to use Cosmos DB with Gremlin in a past article</a>.

Now here’s a little secret:  although we choose the “model” (e.g. Gremlin) at the Cosmos DB account level, we can use other models to query the data.

Not all combination are possible, but many are.  Specifically, we can query a Gremlin graph using DocumentDB / SQL query language.

The graph is then projected into documents.

We will explore that in this article.

Why is that interesting?  Because there are a lot of tools out there we might be familiar with to manipulate DocumentDB (or MongoDB).  Having to possibility to look at a Graph with other APIs extends our toolset from Gremlin-based ones.

UPDATE (01-11-2017):  A deeper discussion about changing the underlying API can be found in the article <a href="https://vincentlauzon.com/2017/09/10/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/">Hacking: accessing a graph in Cosmos DB with SQL / DocumentDB API</a>.
<h2>Creating a simple graph in Gremlin</h2>
Let’s create a simple graph in a Cosmos DB using Gremlin.  <a href="https://vincentlauzon.com/2017/08/28/cosmos-db-graph-with-gremlin-getting-started/">In a past article we’ve looked at how to setup Gremlin with Cosmos DB</a>.

[code language="groovy"]

gremlin&gt; :remote connect tinkerpop.server conf/remote-secure.yaml

gremlin&gt; :&gt; g.addV('person').property('id', 'Alice').property('age', 42).property('department', 'stereotype')

gremlin&gt; :&gt; g.addV('person').property('id', 'Bob').property('age', 24).property('department', 'support character')

gremlin&gt; :&gt; g.V('Alice').addE('communicatesWith').property('id', 'AliceToBob').property('language', 'English').to(g.V('Bob'))

[/code]

The first line is there to connect to the remote server we configured in <em>remote-secure.yaml</em>.  For details <a href="https://vincentlauzon.com/2017/08/28/cosmos-db-graph-with-gremlin-getting-started/">see the setup article</a>.

We now have a toy graph with two vertices connected with one edge.  Nothing too fancy but that will be enough for our purpose.

<a href="/assets/2017/9/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/9/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/image_thumb.png" alt="image" width="211" height="97" border="0" /></a>

We can note the following:
<ul>
 	<li>We provided the ids of objects ; this isn’t always possible in graph databases but is possible with Cosmos DB (if we don't provide it, a randomly generated GUID is automatically provisioned)</li>
 	<li>We did provide a custom property (i.e. <em>language</em>) on the edge</li>
 	<li>The graph partition key is <em>department</em> hence we provided it for each vertex</li>
</ul>
<h2>Document Query</h2>
<a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Graph-to-Doc" target="_blank" rel="noopener">The code is available on GitHub</a>, more specifically in the <a href="https://github.com/vplauzon/cosmos-db/blob/master/Cosmos-DB-Graph-to-Doc/DemoDocDbOnGraph/Program.cs" target="_blank" rel="noopener">Program.cs file</a>.

Here we build on the code from the <a href="https://vincentlauzon.com/2017/08/31/cosmos-db-async-querying-streaming/">Cosmos DB async streaming article</a>.  We simply read all the documents in the graph with DocumentDB API and output them in JSON format:

[code language="groovy"]

private async static Task ListAllDocumentsAsync(
    DocumentClient client,
    Uri collectionUri)
{
    var query = client.CreateDocumentQuery(
        collectionUri,
        new FeedOptions
        {
            EnableCrossPartitionQuery = true
        });
    var queryAll = query.AsDocumentQuery();
    var all = await GetAllResultsAsync(queryAll);

    Console.WriteLine($&quot;Collection contains {all.Length} documents:&quot;);

    foreach (var d in all)
    {
        var json = GetJson(d);

        if (d.Id == &quot;CarolToAlice&quot;)
        {
            await client.DeleteDocumentAsync(
                d.SelfLink,
                new RequestOptions
                {
                    PartitionKey = new PartitionKey(d.GetPropertyValue&lt;string&gt;(&quot;department&quot;))
                });
        }

        Console.WriteLine(json);
    }

    Console.WriteLine();
}

[/code]

The output should be the following:

[code language="javascript"]

{
   &quot;id&quot;: &quot;Bob&quot;,
   &quot;_rid&quot;: &quot;smp9AKyqeQADAAAAAAAABA==&quot;,
   &quot;_self&quot;: &quot;dbs/smp9AA==/colls/smp9AKyqeQA=/docs/smp9AKyqeQADAAAAAAAABA==/&quot;,
   &quot;_ts&quot;: 1504096168,
   &quot;_etag&quot;: &quot;\&quot;00001c04-0000-0000-0000-59a6afad0000\&quot;&quot;,
   &quot;label&quot;: &quot;person&quot;,
   &quot;age&quot;: [
     {
       &quot;_value&quot;: 24,
       &quot;id&quot;: &quot;88a659bf-84d1-4c13-8450-ee57b426b7b3&quot;
     }
   ],
   &quot;department&quot;: &quot;support character&quot;
}
 {
   &quot;id&quot;: &quot;Alice&quot;,
   &quot;_rid&quot;: &quot;smp9AKyqeQAKAAAAAAAABg==&quot;,
   &quot;_self&quot;: &quot;dbs/smp9AA==/colls/smp9AKyqeQA=/docs/smp9AKyqeQAKAAAAAAAABg==/&quot;,
   &quot;_ts&quot;: 1504096164,
   &quot;_etag&quot;: &quot;\&quot;0000ed09-0000-0000-0000-59a6afa60000\&quot;&quot;,
   &quot;label&quot;: &quot;person&quot;,
   &quot;age&quot;: [
     {
       &quot;_value&quot;: 42,
       &quot;id&quot;: &quot;78109dc8-587f-4d87-9d2e-e4a1731dec2b&quot;
     }
   ],
   &quot;department&quot;: &quot;stereotype&quot;
 }
 {
   &quot;id&quot;: &quot;AliceToBob&quot;,
   &quot;_rid&quot;: &quot;smp9AKyqeQALAAAAAAAABg==&quot;,
   &quot;_self&quot;: &quot;dbs/smp9AA==/colls/smp9AKyqeQA=/docs/smp9AKyqeQALAAAAAAAABg==/&quot;,
   &quot;_ts&quot;: 1504096178,
   &quot;_etag&quot;: &quot;\&quot;0000ee09-0000-0000-0000-59a6afb40000\&quot;&quot;,
   &quot;label&quot;: &quot;communicatesWith&quot;,
   &quot;language&quot;: &quot;English&quot;,
   &quot;_sink&quot;: &quot;Bob&quot;,
   &quot;_sinkLabel&quot;: &quot;person&quot;,
   &quot;_sinkPartition&quot;: &quot;support character&quot;,
   &quot;_vertexId&quot;: &quot;Alice&quot;,
   &quot;_vertexLabel&quot;: &quot;person&quot;,
   &quot;_isEdge&quot;: true,
   &quot;department&quot;: &quot;stereotype&quot;
 }

[/code]

We can learn a lot from this projection:
<ul>
 	<li>Vertices are pretty close to simple DocumentDB document ; the properties starting with an underscore (_) are our usual DocumentDB metadata (e.g. <em>_self</em>)</li>
 	<li>Vertex Properties (e.g. age) are represented as an array of complex sub structures (<em>_value</em> and an <em>id</em>) ; this is because in Gremlin a vertex’ (or edge’s) properties can have multiple values</li>
 	<li>Edges are more complex
<ul>
 	<li>A metadata property <em>_isEdge</em> seems to be the discriminator between a vertex and an edge</li>
 	<li><em>_vertexId</em> &amp; <em>_vertexLabel</em> identify the “source” of the edge (the starting point)</li>
 	<li><em>_sink</em>, <em>_sinkLabel</em> &amp; <em>_sinkPartition</em> identify the “target” of the edge (the destination point)</li>
 	<li>The partition of the edge is the same as the “source” vertex, even if we didn’t specify it in Gremlin</li>
 	<li>The custom property <em>language</em> is a flat property, not a complex one with arrays as in the vertices</li>
</ul>
</li>
</ul>
Given that information, we can easily write queries, for instance, to list only vertices:

[code language="csharp"]

private class MinimalDoc
{
    public string id { get; set; }
    public bool? _isEdge { get; set; }
}

private async static Task ListOnlyVerticesAsync(
    DocumentClient client,
    Uri collectionUri)
{
    var query = client.CreateDocumentQuery&lt;MinimalDoc&gt;(
        collectionUri,
        new FeedOptions
        {
            EnableCrossPartitionQuery = true
        });
    var queryVertex = (from d in query
                        where !d._isEdge.HasValue
                        select d).AsDocumentQuery();
    var all = await GetAllResultsAsync(queryVertex);

    Console.WriteLine($&quot;Collection contains {all.Length} documents:&quot;);

    foreach (var d in all)
    {
        Console.WriteLine(d.id);
    }

    Console.WriteLine();
}

[/code]

This should list Alice &amp; Bob but not the edge between them.
<h2>Can we write?</h2>
Querying is all nice and good, but what about writing?

Let’s try to simply add a document in the graph:

[code language="csharp"]

private async static Task AddTrivialVertexAsync(
    DocumentClient client,
    Uri collectionUri)
{
    var response = await client.CreateDocumentAsync(
        collectionUri,
        new
        {
            id = &quot;Carol&quot;,
            label = &quot;person&quot;,
            department = &quot;support character&quot;
        });
    var json = GetJson(response.Resource);

    Console.WriteLine(json);
}

[/code]

If we use the Gremlin Console to look at it:

[code language="groovy"]

gremlin&gt; :&gt; g.V(&quot;Carol&quot;)

==&gt;[id:Carol,label:person,type:vertex,properties:[department:[[id:Carol|department,value:support character]]]]

[/code]

Hence we see the new document as a vertex.  That makes sense since we’ve seen that vertices are projected as simple documents.

If we add other simple properties (like we did with <em>label</em>) this will not work.  Those properties won’t show up in Gremlin.  That is because, as we’ve seen, in Gremlin, properties are always collections.  We can do that:

[code language="csharp"]

private async static Task AddVertexWithPropertiesAsync(
    DocumentClient client,
    Uri collectionUri)
{
    var response = await client.CreateDocumentAsync(
        collectionUri,
        new
        {
            id = &quot;David&quot;,
            label = &quot;person&quot;,
            age = new[] {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    _value = 48
                }
            },
            department = &quot;support character&quot;
        });
    var json = GetJson(response.Resource);

    Console.WriteLine(json);
}

[/code]

and in Gremlin:

[code language="groovy"]

gremlin&gt; :&gt; g.V(&quot;David&quot;).valueMap()

==&gt;[age:[48],department:[support character]]

[/code]

So it appears we can successfully write vertices in a graph using the DocumentDB API.

This is obviously useful to mass import graphs since there are a lot of tools out there that can import into DocumentDB.
<h2>Writing an edge</h2>
We can write vertices.  That is only half the equation for importing data in a graph.  What about edges?

It turns out we simply have to mimic what we’ve seen with existing edges:

[code language="csharp"]

private static async Task AddEdgeAsync(DocumentClient client, Uri collectionUri)
{
    var response = await client.CreateDocumentAsync(
        collectionUri,
        new
        {
            _isEdge = true,
            id = &quot;CarolToAlice&quot;,
            label = &quot;eavesdropOn&quot;,
            language = &quot;English&quot;,
            department = &quot;support character&quot;,
            _vertexId = &quot;Carol&quot;,
            _vertexLabel = &quot;person&quot;,
            _sink = &quot;Alice&quot;,
            _sinkLabel = &quot;person&quot;,
            _sinkPartition = &quot;stereotype&quot;
        });
    var json = GetJson(response.Resource);

    Console.WriteLine(json);
}

[/code]

It is important for the edge's partition to be the same as the source vertex, otherwise the edge won’t be seen by Gremlin.

We can validate the edge is now present in Gremlin:

[code language="groovy"]

gremlin&gt; :&gt; g.E()

==&gt;[id:CarolToAlice,label:eavesdropOn,type:edge,inVLabel:person,outVLabel:person,inV:Alice,outV:Carol,properties:[language:English]]
 ==&gt;[id:AliceToBob,label:communicatesWith,type:edge,inVLabel:person,outVLabel:person,inV:Bob,outV:Alice,properties:[language:English]]

gremlin&gt; :&gt; g.V(&quot;Carol&quot;).out(&quot;eavesdropOn&quot;)

==&gt;[id:Alice,label:person,type:vertex,properties:[age:[[id:78109dc8-587f-4d87-9d2e-e4a1731dec2b,value:42]],department:[[id:Alice|department,value:stereotype]]]]

[/code]

<h2>Summary</h2>
We’ve seen it is possible to both read and write to a Cosmos DB graph using the DocumentDB API.

It would also be possible to do so using the MongoDB API.

An obvious use is to leverage DocumentDB (or MongoDB) tools to manipulate a graph, e.g. for an initial load.