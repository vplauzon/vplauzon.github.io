---
title: Azure DocumentDB Demo
date: 2015-12-01 18:00:46 -05:00
permalink: /2015/12/01/azure-documentdb-demo/
categories:
- Solution
tags:
- NoSQL
---
December the 1st, 2015, I'm doing a presentation to a Montreal User Group, <a href="http://www.meetup.com/msdevmtl/events/223839818/" target="_blank">MS DEV MTL</a>. Here is the script of each demo.  Enjoy!

UPDATE:  You can see the <a href="http://www.slideshare.net/MSDEVMTL/introduction-documentdb" target="_blank">presentation slides here</a>.

&nbsp;
<h3>Account Creation &amp; Adding Documents</h3>
For the creation of an Azure DocumentDB account, allow me to refer to myself in <a href="http://vincentlauzon.com/2014/10/16/creating-an-azure-documentdb-account/">Creating an Azure DocumentDB account</a>.

In order to add a database, in your DocumentDB account blade, click "Add Database", name it <strong>Demo-DB</strong>.

Select that database ; that will open the database blade. Click "Add Collection", name it <strong>demo</strong>. Change the price tier to <strong>S1</strong>.

Select the collection you just created. That will open the collection blade. We are going to create two documents. For that, click "Create Document" on top of the collection blade. First document:

[code language="javascript"]
{
&quot;firstName&quot; : &quot;Vincent-Philippe&quot;,
&quot;lastName&quot; : &quot;Lauzon&quot;,
&quot;office&quot; : &quot;MTL&quot;
}
[/code]

Second document:

[code language="javascript"]
{
&quot;office&quot; : &quot;MTL&quot;,
&quot;address&quot; :
{
&quot;streetNumber&quot; : 2000,
&quot;streetName&quot; : &quot;McGill College&quot;,
&quot;streetType&quot; : &quot;Avenue&quot;,
&quot;inBuilding&quot; : &quot;Suite 500&quot;,
&quot;postalCode&quot; : &quot;H3A 3H3&quot;
}
}
[/code]

Now, let's look at those document within the collection. In the collection blade, click "Document Explorer" (at the bottom). You will notice a few things:
<ul>
	<li>Both documents were added an <strong>id</strong> property containing a generated GUID</li>
	<li>Both documents didn't have the same schema</li>
	<li>JavaScript types <em>string</em> and <em>integer</em> were used</li>
</ul>
Let's add a third document:

[code language="javascript"]
{
&quot;firstName&quot; : &quot;John&quot;,
&quot;lastName&quot; : &quot;Smith&quot;,
&quot;office&quot; : &quot;Calgary&quot;,
&quot;id&quot; : &quot;emp-john-smith&quot;,
&quot;phoneNumber&quot; : &quot;123-456-7890&quot;
}
[/code]

You can go ahead and look at the document and observe that:
<ul>
	<li>We manually inserted the <em>id</em> of the document here ; DocumentDB used the <em>id</em></li>
	<li>The schema was slightly different that the other employee</li>
</ul>
<h3>Simple Querying</h3>
For querying, in the collection blade, click "Query Explorer". Leave the query as is, i.e.

&nbsp;

[code language="sql"]
SELECT * FROM c
[/code]

&nbsp;

Let's observe a few things:
<ul>
	<li>In the query, <em>c</em> stands for the collection. It is a variable name: you can replace <em>c</em> by whatever literal you fancy</li>
	<li>The result is a JSON array containing the original documents in each</li>
	<li>The documents have more "metadata", i.e. properties starting with _, such as <em>_ts</em>, the timestamp</li>
</ul>
Let's try something slightly less trivial:

&nbsp;

[code language="sql"]
SELECT *
FROM c
WHERE c.firstName != null
[/code]

&nbsp;

Now we have only the <em>employees</em>, i.e. we skipped the MTL office document.

The following query does a projection or a JSON transformation:

&nbsp;

[code language="sql"]
SELECT
{&quot;firstName&quot;:c.firstName, &quot;lastName&quot;:c.lastName} AS name,
c.office
FROM c
WHERE c.firstName!=null
[/code]

&nbsp;

This yields the following results:

[code language="sql"]
[
{
 &quot;name&quot;: {
 &quot;firstName&quot;: &quot;Vincent-Philippe&quot;,
 &quot;lastName&quot;: &quot;Lauzon&quot;
 },
 &quot;office&quot;: &quot;MTL&quot;
 },
 {
 &quot;name&quot;: {
 &quot;firstName&quot;: &quot;John&quot;,
 &quot;lastName&quot;: &quot;Smith&quot;
 },
 &quot;office&quot;: &quot;Calgary&quot;
 }
]
[/code]

&nbsp;

This demonstrates how DocumentDB merges the power of T-SQL with the JavaScript language seamlessly.

To explore more about querying, go to the <a href="https://www.documentdb.com/sql/demo" target="_blank">querying playground</a> where you can explore interactively (web browser).
<h3>Indexing Policy</h3>
To look at the current indexing policy of a collection, in the collection blade, click "Indexing Policy". Typically, you'll see the following:

&nbsp;

[code language="javascript"]
{
 &quot;indexingMode&quot;: &quot;consistent&quot;,
 &quot;automatic&quot;: true,
 &quot;includedPaths&quot;: [
 {
 &quot;path&quot;: &quot;/*&quot;,
 &quot;indexes&quot;: [
 {
 &quot;kind&quot;: &quot;Range&quot;,
 &quot;dataType&quot;: &quot;Number&quot;,
 &quot;precision&quot;: -1
 },
 {
 &quot;kind&quot;: &quot;Hash&quot;,
 &quot;dataType&quot;: &quot;String&quot;,
 &quot;precision&quot;: 3
 },
 {
 &quot;kind&quot;: &quot;Spatial&quot;,
 &quot;dataType&quot;: &quot;Point&quot;
 }
 ]
 },
 {
 &quot;path&quot;: &quot;/\&quot;_ts\&quot;/?&quot;,
 &quot;indexes&quot;: [
 {
 &quot;kind&quot;: &quot;Range&quot;,
 &quot;dataType&quot;: &quot;Number&quot;,
 &quot;precision&quot;: -1
 },
 {
 &quot;kind&quot;: &quot;Hash&quot;,
 &quot;dataType&quot;: &quot;String&quot;,
 &quot;precision&quot;: 3
 }
 ]
 }
 ],
 &quot;excludedPaths&quot;: []
}
[/code]

&nbsp;

where you can observe
<ul>
	<li>Indexing is consistent (done synchronously with changes)</li>
	<li>Indexing is automatic</li>
	<li>Includes all properties</li>
	<li>Numbers have range indexes, strings hashes and point spatial</li>
	<li>Timestamp are both range &amp; hash</li>
	<li>No paths are excluded</li>
</ul>
<h3>Looking at consistency level</h3>
Go in you DocumentDB account blade, at the bottom, in "Configuration", click "Default consistency".

You can actually see the definitions of each level in the portal.
<h3>SDK Demo</h3>
Start up a new Console App project. Get the NuGet package <a href="http://www.nuget.org/packages/Microsoft.Azure.DocumentDB/" target="_blank">Microsoft.Azure.DocumentDB</a>.

Everything orbits around the <em>DocumentClient</em> component. To instantiate one, you need information from your DocumentDB account. In the account blade, click the key icon.

You'll need:
<ul>
	<li>URI (serviceEndPoint in the SDK)</li>
	<li>Primary key (authKey in the SDK)</li>
</ul>
In the code, simply instantiate it as:

[code language="csharp"]
private static readonly DocumentClient _docClient = new DocumentClient(
new Uri(ENDPOINT),
AUTH_KEY,
ConnectionPolicy.Default,
ConsistencyLevel.Session);
[/code]

Here you see that you can override the connection policy (see <a href="http://vincentlauzon.com/2015/06/27/azure-documentdb-performance-tips/">this post</a> for details) and the consistency level for the connection.

The rest of the code will use the method "QueryAsync" defined in <a href="http://vincentlauzon.com/2015/01/06/documentdb-async-querying-streaming/">this post</a>.

First, let's find our collection, in purely scalable way:
<div>

&nbsp;

[code language="csharp"]
private async static Task&lt;DocumentCollection&gt; GetCollectionAsync()
 {
 var dbQuery = from db in _docClient.CreateDatabaseQuery()
 where db.Id == DB_NAME
 select db;
 var database = (await QueryAsync(dbQuery)).FirstOrDefault();
 var collectionQuery = from col in _docClient.CreateDocumentCollectionQuery(database.AltLink)
 where col.Id == COLLECTION_NAME
 select col;
 var collection = (await QueryAsync(collectionQuery)).FirstOrDefault();
 return collection;
 }
[/code]

&nbsp;

</div>
<div></div>
<div>What we do here is basically search our database among databases within the account by querying the database list, then do the same thing with collection.</div>
<div></div>
<div>The interesting points to notice here is that we do everything async, including querying. There is nothing blocking here.</div>
<div></div>
<div>Let's define an employee object, a PONO:</div>
<div>

[code language="csharp"]
public class Employee
 {
 [JsonProperty(&quot;id&quot;)]
 public string ID { get; set; }

 [JsonProperty(&quot;firstName&quot;)]
 public string FirstName { get; set; }

 [JsonProperty(&quot;lastName&quot;)]
 public string LastName { get; set; }

 [JsonProperty(&quot;office&quot;)]
 public string Office { get; set; }

 [JsonProperty(&quot;phoneNumber&quot;)]
 public string PhoneNumber { get; set; }
 }
[/code]

</div>
<div></div>
<div>Here we use attributes to map property names to bridge the gap of JavaScript and C# in terms of naming convention, i.e. the fact that JavaScript typically starts with lowercase while C# starts with uppercase. Other approach could have been used.</div>
<div></div>
<div>Let's define a method to find me:</div>
<div></div>
<div>
<div>

&nbsp;

[code language="csharp"]
private async static Task&lt;Employee&gt; QueryVinceAsync(DocumentCollection collection)
 {
 var employees = from e in _docClient.CreateDocumentQuery&lt;Employee&gt;(collection.SelfLink)
 where e.FirstName == &quot;Vincent-Philippe&quot;
 select e;
 var vincent = (await QueryAsync(employees)).FirstOrDefault();
 return vincent;
 }
[/code]

&nbsp;

</div>
</div>
<div></div>
<div>Here, we again do a query, this time on documents within a collection. We strong type the query for employee's type. That doesn't filter out non-employees though. The filter on the query does that: it searches for document having a property <em>firstName</em> being equaled to <em>Vincent-Philippe</em>. Document without such a property obviously fail that filter.</div>
<div></div>
<div>Then we can look at the code of the demo:</div>
<div></div>
<div>
<div>

&nbsp;

[code language="csharp"]
private static async Task DemoAsync()
 {
 var collection = await GetCollectionAsync();
 var vincent = await QueryVinceAsync(collection);
 var newEmployee = new Employee
 {
 FirstName = &quot;Jessica&quot;,
 LastName = &quot;Jones&quot;,
 Office = &quot;Hell's Kitchen&quot;,
 PhoneNumber = &quot;Unknown&quot;
 };
 var newEmployeeResponse =
 await _docClient.CreateDocumentAsync(collection.SelfLink, newEmployee);
 // ID of the created employee document
 Console.WriteLine(newEmployeeResponse.Resource.Id);
 }
[/code]

&nbsp;

</div>
</div>
<div></div>
<div>Interesting point here is the return type of document creation method. Since the SDK is a thin wrapper around REST calls, the return type returns all the stuff returned by the REST call. Of interest: <i>newEmployeeResponse</i>.<em>RequestCharge</em>. This is 6.1 and this is in Request Units (RUs). This helps you figure out the pricing tier you should look after.</div>
<div></div>
<div></div>
&nbsp;