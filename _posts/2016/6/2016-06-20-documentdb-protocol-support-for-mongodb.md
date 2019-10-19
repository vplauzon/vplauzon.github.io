---
title:  DocumentDB protocol support for MongoDB
date:  2016-06-20 20:23:21 -04:00
permalink:  "/2016/06/20/documentdb-protocol-support-for-mongodb/"
categories:
- Solution
tags:
- Data
- NoSQL
---
<a href="assets/2016/6/documentdb-protocol-support-for-mongodb/pexels-photo-91413.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;margin:0 10px 0 0;display:inline;padding-right:0;border:0;" title="pexels-photo-91413" src="assets/2016/6/documentdb-protocol-support-for-mongodb/pexels-photo-91413_thumb.jpg" alt="pexels-photo-91413" width="640" height="427" align="left" border="0" /></a>Microsoft announced, in the wake of many DocumentDB announcement, that <a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-protocol-mongodb/" target="_blank">DocumentDB would support MongoDB protocol</a>.

What does that mean?

It means you can now swap a DocumentDB for a MongoDB and the client (e.g. your web application) will work the same.

This is huge.

It is huge because Azure, and the cloud in general, have few <em>Databases as a Service</em>.

Azure has <a href="https://azure.microsoft.com/en-us/services/sql-database/" target="_blank">SQL Database</a>, <a href="https://azure.microsoft.com/en-us/services/sql-data-warehouse/" target="_blank">SQL Data Warehouse</a>, <a href="https://azure.microsoft.com/en-us/services/cache/" target="_blank">Redis Cache</a>, <a href="https://azure.microsoft.com/en-us/services/search/" target="_blank">Search</a> &amp; <a href="https://azure.microsoft.com/en-us/services/documentdb/" target="_blank">DocumentDB</a>.  You could argue that <a href="https://azure.microsoft.com/en-us/services/storage/" target="_blank">Azure Storage</a> (Blob, Table, queues &amp; files) is also one.  <a href="https://azure.microsoft.com/en-us/services/hdinsight/" target="_blank">HBase under HDInsight</a> could be another.  <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Data Lake Store</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Data Lake Analytics</a> too.

Still, compare that to any list of the <a href="https://en.wikipedia.org/wiki/NoSQL#Types_and_examples_of_NoSQL_databases" target="_blank">main players in NoSQL</a> and less than 10 services isn’t much.  For all the other options, you need to build it on VMs.  Since those are database workloads, optimizing their performance can be tricky.

<a href="https://www.mongodb.com/" target="_blank">MongoDB</a> is a leader in the document-oriented NoSQL databases space.

With the recent announcement, this means all MongoDB clients can potentially / eventually run on Azure with much less effort.

And this is why this is a huge news.
<h2>A different account</h2>
For the time being, DocumentDB supports MongoDB through a different type of DocumentDB account.

You need to create your DocumentDB account as a <a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-create-mongodb-account/" target="_blank">DocumentDB - Protocol Support for MongoDB</a>.

You’ll notice the portal interface is different for such accounts.

You can then access those accounts using familiar MongoDB tool such as <a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-mongodb-mongochef/" target="_blank">MongoChef</a>.

But you can still use DocumentDB tools to access your account too.
<h2>Summary</h2>
In a way you could say that Azure now has <em>MongoDB as a Service</em>.

A big caveat is that the protocol surface supported isn’t %100.  <a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-protocol-mongodb/#what-is-documentdb-protocol-support-for-mongodb" target="_blank">CRUDs are supported</a> and the rest is prioritized and worked on.

Yet, the data story in Azure keep growing.

<strong>UPDATE</strong>:  <em>To get started, check out:</em>
<ul>
 	<li><em><a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-create-mongodb-account/" target="_blank">Creating account</a></em></li>
 	<li><em><a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-connect-mongodb-account/" target="_blank">How to connect</a></em></li>
 	<li><em><a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-mongodb-mongochef/" target="_blank">Using MongoChef with DocumentDB</a></em></li>
 	<li><em><a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-mongodb-samples/" target="_blank">Protocol support samples</a></em></li>
 	<li><em><a href="https://azure.microsoft.com/en-us/documentation/articles/documentdb-mongodb-guidelines/" target="_blank">Guidelines</a></em></li>
</ul>
&nbsp;