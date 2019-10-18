---
title:  Azure Databricks - Getting Started
date:  12/18/2017 11:30:30
permalink:  "/2017/12/18/azure-databricks-getting-started/"
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="assets/2017/12/azure-databricks-getting-started/databricks_logo1.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="Databricks_logo[1]" src="assets/2017/12/azure-databricks-getting-started/databricks_logo1_thumb.png" alt="Databricks_logo[1]" width="140" height="140" align="right" border="0" /></a><a href="https://en.wikipedia.org/wiki/Apache_Spark" target="_blank" rel="noopener">Apache Spark</a> is rising in popularity as a Big Data platform.  It exists on this accelerated timeline for such an impactful technology.

Think about it:
<ul>
 	<li>2009, started as a <a href="https://en.wikipedia.org/wiki/UC_Berkeley" target="_blank" rel="noopener">Berkeley’s University</a> project.</li>
 	<li>2010, open sourced</li>
 	<li>2013, donated to Apache Foundation</li>
 	<li>2014, becomes Top-Level Apache Project</li>
</ul>
In 2013, the creators of Spark founded <a href="https://en.wikipedia.org/wiki/Databricks" target="_blank" rel="noopener">Databricks</a>.  Databricks has developped, among other things, a cluster management system for Spark as well as a notebook web interface.

Microsoft &amp; Databricks collaborated to create <a href="https://databricks.com/azure" target="_blank" rel="noopener">Azure Databricks</a>:

<em>Designed in collaboration with Microsoft and the creators of Apache Spark, Azure Databricks combines the best of Databricks and Azure to help customers accelerate innovation with one-click set up, streamlined workflows and an interactive workspace that enables collaboration between data scientists, data engineers, and business analysts.</em>

One of the main reason for Spark popularity is its speed, many time faster than Hadoop.  Databricks brings that speed to the fingertips of the Data Scientist with web notebook, enabling interactive data science.  Azure Databricks now enable that speed with the power and flexibility of the cloud.  We can start a cluster in minutes and scale it up or down on demand.
<h2>What is it?</h2>
Azure Databricks is a managed Spark Cluster service.  Cluster size can either be fixed or auto scaled.  Interaction with the cluster can be done through web notebooks or <a href="https://docs.azuredatabricks.net/api/index.html" target="_blank" rel="noopener">REST APIs</a>.

The service integrates with different Azure Data Services such as Blob Storage, SQL Data Warehouse, Power BI, Data Lake Store, etc.  .  It also integrates with Hadoop / HD Insights, e.g. Kafka, Hive, HDFS, etc.  .
<h2>Getting started</h2>
An obvious starting point is the <a href="https://docs.microsoft.com/en-ca/azure/azure-databricks/what-is-azure-databricks" target="_blank" rel="noopener">Azure online documentation</a>.  At the time of this writing (mid December 2017), that documentation has few pages but it links to another <a href="https://docs.azuredatabricks.net/" target="_blank" rel="noopener">online documentation on Azure Databricks which is published by Databricks</a>.

We would recommend glimpsing through those to get familiar with the service and provision a first cluster.  It is then quite easy to iterate from there:  experiment in the web environment (notebooks) and read some more documentation.
<h2>Spark itself</h2>
For those who aren’t familiar with Azure Spark, there are plenty of documentation online.  Apache Spark has a <a href="https://spark.apache.org/docs/latest/" target="_blank" rel="noopener">comprehensive documentation</a>.

One of the main differences between Hadoop &amp; Spark is that Hadoop use storage as shared state (HDFS) while Spark uses in-memory shared state in the form of <a href="https://spark.apache.org/docs/latest/rdd-programming-guide.html" target="_blank" rel="noopener">Resilient Distributed Datasets</a> (RDDs).  RDDs can be manipulated in Scala, Java or Python.

RDD programming is what Spark Core is about.  Higher level APIs, i.e. Spark SQL, GraphX, Spark Streaming &amp; MLlib are all based on RDDs.

There are tutorials online, for instance, <a href="https://www.tutorialspoint.com/apache_spark/" target="_blank" rel="noopener">Tutorial Points has a comprehensive tutorial</a>.  We found a good introduction was the book <em>Taming Big Data with Apache Spark and Python</em> by Frank Kane.  It also exist as a <a href="https://www.safaribooksonline.com/library/view/taming-big-data/9781787129931/" target="_blank" rel="noopener">video presentation</a> which can be consumed within 6 to 8 hours.  That author actually recommend other books to go deeper:
<ul>
 	<li><a href="http://shop.oreilly.com/product/0636920028512.do" target="_blank" rel="noopener">Learning Spark, Lightning-Fast Big Data Analysis</a> by Matei Zaharia, Holden Karau, Andy Konwinski, Patrick Wendell</li>
 	<li><a href="http://shop.oreilly.com/product/0636920035091.do" target="_blank" rel="noopener">Advanced Analytics with Spark, Patterns for Learning from Data at Scale</a> by Sandy Ryza, Uri Laserson, Josh Wills, Sean Owen</li>
 	<li><a href="http://shop.oreilly.com/product/0636920033950.do" target="_blank" rel="noopener">Data Algorithms, Recipes for Scaling Up with Hadoop and Spark</a> by Mahmoud Parsian</li>
</ul>
<h2>Service interaction</h2>
At the time of this writing, mid December 2017, the service feels like a shell to Databricks.  An instance of the service can have multiple clusters attached to it and they are created in the Databricks portal.

In time the Azure Portal and corresponding REST API, PowerShell cmdlets and CLI commands will likely expose more functionality, but for now we must interact directly with Databricks REST API
<h2>Summary</h2>
It is an exciting time to do Data Science on Azure!

Two years ago we wrote a <a href="https://vincentlauzon.com/2016/02/15/querying-tables-in-azure-data-lake-analytics/" target="_blank" rel="noopener">series of articles about Azure Data Lake Analytics</a>.  We might port a couple of those examples in Azure Databricks in the following months.