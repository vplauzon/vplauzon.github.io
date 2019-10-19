---
title: Hadoop ecosystem overview
date: 2015-09-20 19:00:18 -04:00
permalink: /2015/09/20/hadoop-ecosystem-overview/
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="/assets/2015/9/hadoop-ecosystem-overview/hadoop.png"><img class="size-full wp-image-1263 alignright" src="/assets/2015/9/hadoop-ecosystem-overview/hadoop.png" alt="Hadoop" width="241" height="178" /></a>Have taken a look at Hadoop lately?

People who do not know Hadoop think it's a big data technology the same way SQL Server is a technology.

But Hadoop is more of an ecosystem of different modules interacting together.  This is its major strength and also the source of its major weakness, i.e. its lack of strong cohesion.

In this blog post, I'll give an overview of that ecosystem.  If you're new to Hadoop, this could be an easy introduction.  If you are steep in some Hadoop technology, this post could give you the opportunity to look around the ecosystem for things you aren't specialized in.
<h3>Distributions</h3>
Hadoop is an <a href="http://hadoop.apache.org/" target="_blank">open-source Apache project</a>.  It regroups a bunch of different modules being themselves open-source project.

In order to use Hadoop, you need to download quite a few of those projects, make sure their versions are compatible and assemble them.

This is what Hadoop distributions do.  The two leading distributions are <a href="https://en.wikipedia.org/wiki/Cloudera" target="_blank">Cloudera</a> and <a href="https://en.wikipedia.org/wiki/Hortonworks" target="_blank">Hortonworks</a>.  Both distributions are fully supported on Azure Virtual Machines.
<h3>HDInsight</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/hdinsight.png"><img class="wp-image-1262 alignnone" src="/assets/2015/9/hadoop-ecosystem-overview/hdinsight.png" alt="HDInsight" width="161" height="140" /></a><a href="https://technet.microsoft.com/en-us/library/dn247618.aspx?f=255&amp;MSPPError=-2147217396" target="_blank">HDInsight</a> is a Windows based Hadoop distribution developed by Hortonworks &amp; Microsoft.
<h3>Azure HDInsight</h3>
<a href="http://azure.microsoft.com/en-us/services/hdinsight/" target="_blank">Azure HDInsight</a> is a managed Service on Azure.  It allows you to create a fully managed Hadoop cluster in Azure.  It is using HDInsight for the Windows implementation but it also supports a Linux implementation.

As mentioned above, Microsoft supports Cloudera &amp; Hortonworks in Virtual Machines, that is, if you install them in Azure VMs.  But Azure HDInsight is more than that.  It is a managed service, i.e. you do not need to worry about the VMs, they are managed for you.  Also, you can scale out your cluster in a few mouse clicks, which is quite convenient.

On top of being a managed service, Azure HDInsight is build to have external storage (i.e. blob storage &amp; SQL Azure) in order to make it possible to create clusters temporarily but keep the state between activation.  This creates a very compelling economical model for the service.
<h3>HDFS</h3>
<a href="https://en.wikipedia.org/wiki/Apache_Hadoop#HDFS" target="_blank">Hadoop Distributed File System</a> (HDFS) is a distributed file system.  It is built to make sure data is local to the machine processing it.

Azure HDInsight substitutes HDFS for <a href="http://azure.microsoft.com/en-us/services/storage/" target="_blank">Windows Azure Blob Storage</a> (WASB).  This makes sense since WASB is already a distributed / scalable / highly available file system but also it mostly mitigates a shortcoming of HDFS.

HDFS requires Hadoop to be running to be accessible but it also requires the cluster to store the data.  This means Hadoop clusters must stay up or at least have their VMs in store for the data to exist.

WASB enables economic scenarios where the data is externalized from Hadoop and therefore clusters can be brought up and down always using the same data.
<h3>MapReduce</h3>
Basic paradigm for distributed computing in Hadoop, <a href="http://wiki.apache.org/hadoop/MapReduce" target="_blank">Map Reduce</a> consists in splitting a problem's data into chunk, processing those chunk on different computing units (the mapping phase) and assembling the results (reduce phase).

Map Reduce are written in Java (packaged in jar files) and scheduled as jobs in Hadoop.

Most of Hadoop projects are higher level abstraction leveraging Map Reduce without the complexity of writing the detailed implementation in Java.  For instance, Hive exposes HiveQL as a language to query data in Hadoop.

<a href="http://azure.microsoft.com/en-us/services/batch/" target="_blank">Azure Batch</a> borrows a lot of concepts from Map Reduce.
<h3>YARN</h3>
<em>Yet Another Resource Negotiator</em> (<a href="http://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html" target="_blank">YARN</a>) addresses the original Hadoop scheduling manager shortcomings.  The Map Reduce 2.0 is built on top of YARN.

The original Job Tracker had scalability issues on top of single point of failure.
<h3>Tez</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/apachetezlogo_lowres1.jpg"><img class="size-medium wp-image-1280 alignright" src="/assets/2015/9/hadoop-ecosystem-overview/apachetezlogo_lowres1.jpg?w=300" alt="ApacheTezLogo_lowres[1]" width="300" height="154" /></a><a href="https://tez.apache.org/" target="_blank">Apache Tez</a> is an application framework allowing complex directed-acyclic-graph of tasks to processing data.  It is built on top of YARN and is a substitute to Map Reduce in some scenarios.

It tends to generate less jobs than Map Reduce and is hence more efficient.
<h3>Hive</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/hive_logo_medium1.jpg"><img class="size-full wp-image-1225 alignleft" src="/assets/2015/9/hadoop-ecosystem-overview/hive_logo_medium1.jpg" alt="hive_logo_medium[1]" width="114" height="105" /></a><a href="https://hive.apache.org/" target="_blank">Apache Hive</a> is a data warehouse enabling queries and management over large datasets.

As mentioned earlier, it is an abstraction on top of Hadoop lower level components (HDFS, Map Reduce &amp; Tez).
<h3>HBase</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/jumping-orca_rotated_25percent1.png"><img class="size-full wp-image-1282 alignright" src="/assets/2015/9/hadoop-ecosystem-overview/jumping-orca_rotated_25percent1.png" alt="jumping-orca_rotated_25percent[1]" width="200" height="150" /></a><a href="http://hbase.apache.org/" target="_blank">Apache HBase</a> is column-oriented Big Data NoSql database based on <a href="https://en.wikipedia.org/wiki/BigTable" target="_blank">Google Big Table</a> leveraging HDFS.

In some scenarios HBase performs blazing fast on queries through massive data sets.
<h3>Mahout</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/mahout-logo-brudman1.png"><img class="alignnone size-medium wp-image-1284" src="/assets/2015/9/hadoop-ecosystem-overview/mahout-logo-brudman1.png?w=300" alt="mahout-logo-brudman[1]" width="300" height="63" /></a><a href="http://mahout.apache.org/" target="_blank">Apache Mahout</a> is a platform to run scalable Machine Learning algorithms leveraging Hadoop distributed computing.

It has quite an overlap with <a href="http://azure.microsoft.com/en-us/services/machine-learning/" target="_blank">Azure ML</a>.
<h3>Pig</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/pig1.gif"><img class="wp-image-1285 alignright" src="/assets/2015/9/hadoop-ecosystem-overview/pig1.gif?w=200" alt="pig[1]" width="115" height="173" /></a>An high-level scripting language (Pig Latin) and a run-time environment, <a href="http://pig.apache.org/" target="_blank">Apache Pig</a> is another abstraction on top of map reduce.

Where Hive took a declarative approach with HiveQL, Pig takes a procedural approach.  A Pig Latin program is actually quite similar to a <a href="https://msdn.microsoft.com/en-us/library/ms141026.aspx" target="_blank">SQL Server Integration Services (SSIS)</a> package, defining different steps for manipulating data.

Hive &amp; Pig overlap.  You would choose Pig in scenarios where you are importing and transforming data and you would like to be able to see the intermediate steps (much like an SSIS package).
<h3>Sqoop</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/sqoop-logo1.png"><img class="size-full wp-image-1286 alignleft" src="/assets/2015/9/hadoop-ecosystem-overview/sqoop-logo1.png" alt="sqoop-logo[1]" width="151" height="46" /></a><a href="http://sqoop.apache.org/" target="_blank">Apache Sqoop</a> is Hadoop data movement involving booth relational and non-relational data sources.

It has functionalities very similar to <a href="http://azure.microsoft.com/en-us/services/data-factory/" target="_blank">Azure Data Factory</a>.
<h3>Spark</h3>
<a href="/assets/2015/9/hadoop-ecosystem-overview/spark-logo1.png"><img class="size-full wp-image-1287 alignright" src="/assets/2015/9/hadoop-ecosystem-overview/spark-logo1.png" alt="spark-logo[1]" width="258" height="137" /></a><a href="https://spark.apache.org/" target="_blank">Apache Spark</a> is actually complementary to Hadoop.  In Azure it is packaged as an HDInsight variant.

In many ways Spark is a modern take on Hadoop and typically is faster, up to 100 times faster on some bench marks.

Spark leverages a directed acyclic graph execution engine (a bit like Tez) and leverages in-memory operation aggressively.

On top of its speed, the most compelling aspect of Spark is its consistency.  It is one framework to address scenarios of distributed computing, queries over massive data sets, Complex Event Processing (CEP) and streaming.

Its supported languages are Java, R, Python and Scale.  Will we see a .NET of JavaScript SDK soon?
<h3>Summary</h3>
There are way more Hadoop modules / projects!  I just talked about those I know.

You can find a more complete list <a href="http://www.revelytix.com/?q=content%2Fhadoop-ecosystem" target="_blank">over here</a>.

Hadoop is a very rich ecosystem.  Its diversity can sometimes see as its weakness as each project, while leveraging common low-level components such as HDFS &amp; YARN, are their own little world with different paradigms.

Nevertheless, it is one of the most popular big data platform on the market.