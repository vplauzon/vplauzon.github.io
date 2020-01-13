---
title: Azure Data Lake - Early look
date: 2015-09-30 16:00:38 -07:00
permalink: /2015/09/30/azure-data-lake-early-look/
categories:
- Solution
tags:
- Big Data
---
<em><strong>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/">Azure Data Lake series</a> for more posts on Azure Data Lake.</strong></em>

Ok, this is a <strong>super early</strong> look at the technology.  <a href="https://azure.microsoft.com/en-us/solutions/data-lake/" target="_blank">Azure Data Lake</a> was announced yesterday (September 29th, 2015) at <a href="https://azure.microsoft.com/en-us/azurecon/" target="_blank">AzureCon</a> (and later <a href="http://weblogs.asp.net/scottgu/announcing-general-availability-of-hdinsight-on-linux-new-data-lake-services-and-language" target="_blank">blogged about by Scott Gu</a>), it will public preview at the end of the year so there isn't a tone of documentation about it.

But there has been quite a few characteristics unveiled.

<a href="/assets/posts/2015/3/azure-data-lake-early-look/data-lake-diagram.png"><img class="size-full wp-image-1303 aligncenter" src="/assets/posts/2015/3/azure-data-lake-early-look/data-lake-diagram.png" alt="data-lake-diagram" width="700" height="272" /></a>
<h3>What is a data lake?</h3>
I first came across the concept of Data lake reading Gartner incoming trends reports.  A data lake is your unprocessed / uncleansed (raw) data.  The idea being that instead of having your data stored neatly in a data warehouse where you've cleansed it and probably removed a lot of information from it by keeping only what's necessary by your foreseen analytics, a data lake is your raw data:  not trivial to work with but it contains all the information.
<h3>2 Services</h3>
Actually, there are <a href="http://blogs.technet.com/b/dataplatforminsider/archive/2015/09/28/microsoft-expands-azure-data-lake-to-unleash-big-data-productivity.aspx" target="_blank">2 distinct services</a> here:
<ul>
	<li>Azure Data Lake Store</li>
	<li>Azure Data Lake Analytics</li>
</ul>
The two are sort of loosely coupled although well integrated.

<strong>Azure Data Lake Store</strong> is a storage service, a sort of alternative to Blob Storage.  It features <span style="text-decoration:underline;">huge storage scale</span> (there aren't any advertised capacity limits), low-latency for real-time workload (e.g. IoT) and supports any type of data, i.e. unstructured, semi-structured and structured.  At this point, it isn't clear if it's just a massive blob storage storing files only or if you can really store structured data <em>natively</em> (aka Azure Tables).  On the other hand, the store implements HDFS which is a file system...  so I guess the native format are files.

<strong>Azure Data Lake Analytics</strong>, on the other hand, is an analytics service.  So far, it seems that its primary interface is U-SQL, an extension of T-SQL supporting C# for imperative programming.  It is built on top of YARN (see my <a href="http://vincentlauzon.com/2015/09/20/hadoop-ecosystem-overview/">Hadoop ecosystem overview</a>) but seems to be a Microsoft-only implementation, i.e. it isn't Hive.

On top of that we have Visual Studio tools that seems to be mostly facilitating the authoring / debugging of analytics.

The two services are loosely coupled:  the store implements HDFS and can therefore be queried by anything that understand HDFS.  This doesn't even mean Azure HDInsight only but other Hadoop distributions (e.g. Cloudera),  Spark and Azure Machine Learning.

<a href="/assets/posts/2015/3/azure-data-lake-early-look/928pic21.png"><img class="size-full wp-image-1301 aligncenter" src="/assets/posts/2015/3/azure-data-lake-early-look/928pic21.png" alt="928Pic2[1]" width="640" height="360" /></a>Similarly, Azure Data Lake Analytics can query other stores, such as Hadoop, SQL, Azure SQL Data Warehouse, etc.  .
<h3>U SQL</h3>
U SQL is the <a href="http://blogs.msdn.com/b/visualstudio/archive/2015/09/28/introducing-u-sql.aspx" target="_blank">query language</a> of Azure Data Lake Analytics.  In a nutshell it merges the declarative power of TSQL with the imperative power of C#.

Writing image analysis purely in TSQL would be quite cumbersome.  It is for that type of scenarios that C# is supported.

U SQL lands itself quite naturally to writing data transformations pipelines <em>in-code</em>.  This is very similar to what Hadoop Pig does.

For now I see U SQL as replacing both Hive &amp; Pig in one throw.  On top of that, for developers used to .NET &amp; TSQL, it is very natural and productive.  This is in stark contrasts to approaching Hive, which is <em>kinda</em> SQL but where you need to learn a bunch of minimally documented clutches (for instance, invoking a generalized CSV parser requires you to reference a Java JAR-packaged component in the middle of the schema definition) or PIG, which is its own thing.
<h3>Differentiator</h3>
Ok, so, why would you use Azure Data Lake vs Hadoop with Hive &amp; PIG or Spark?

First, as I just mentioned, you'll be productive way faster with Azure Data Lake.  Not just because you know TSQL &amp; C# but because the integration with Visual Studio will beat all Hadoop odd tools any day.

Second, Azure Data Lake offers a killer features for me:  it offers you to pay per query.  This means you would really pay only for what you use instead of standing up an Hadoop cluster every time you need to perform queries and dropping it once you're done.  Again, this is more productive since you don't have to worry about the cluster management, but it can also be way more economic.

Also, hopefully Data Lake Analytics is faster than Hive!  If we're lucky, it could be comparable to Spark.
<h3>In Summary...</h3>
A very exciting service!  I think its main strength is the seamless integration of the different pieces than the drastic new concepts.

Doing Big Data today is quite a chore.  You have a bunch of different tools to learn to use and string together.  Azure Data Lake could drastically change that.

As usual, a big part will be the pricing of those services.  If they are affordable they could help democratize Big Data Analytics.

Before the public preview arrives, have a look at the <a href="https://azure.microsoft.com/en-us/solutions/data-lake/" target="_blank">Service page</a>.