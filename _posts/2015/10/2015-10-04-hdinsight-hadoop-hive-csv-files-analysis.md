---
title: HDInsight Hadoop Hive - CSV files analysis
date: 2015-10-04 19:00:16 -04:00
permalink: /2015/10/04/hdinsight-hadoop-hive-csv-files-analysis/
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hive_logo_medium1.jpg"><img class="size-full wp-image-1225 alignright" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hive_logo_medium1.jpg" alt="hive_logo_medium[1]" width="114" height="105" /></a>Ok, <a href="http://vincentlauzon.com/2015/09/27/hdinsight-hadoop-hive-setup/">on a past blog</a> we've been setuping Azure HDInsight for some Hive fun.

So let's!

Today I'll go and analyse the data contained in multiple CSV files.  Those files will be created (in Excel) but in a real-world scenario, they could be either data dump on a file server or file imported from a real system.
<h3>Creating some flat files</h3>
First, let's create some data to be consumed by Hive.

Open Excel and author the following:
<table>
<tbody>
<tr>
<td>rand1</td>
<td>Widget</td>
<td>Price</td>
<td>InStock</td>
</tr>
<tr>
<td>=RAND()</td>
<td>=IF(A2&lt;0.3, "Hammer", IF(A2&gt;0.7, "Skrewdriver", "Plier"))</td>
<td>=A2*20</td>
<td>=A2*1000</td>
</tr>
</tbody>
</table>
So basically, in the first column we generate a random number.  In the <em>Widget</em> column we generate a label (from the collection {<em>Hammer</em>, <em>Skrewdriver</em>, <em>Plier</em>}) based on that random number.  In the <em>Price</em> column we generate a price based on the random column.  Finally in the <em>InStock</em> column, we generate a number of items, still based on the random column.

So, yes, we are generating random dummy data.  Can't wait to see the insight we're going to get out of that!

Now, let's <a href="http://www.excelfunctions.net/Excel-Autofill.html" target="_blank">auto-fill</a> 100 rows using the first data row (i.e. the second row I made you type).  You should end up with something like that (but with totally different values, thanks to randomness):

<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/sample.png"><img class="alignnone size-full wp-image-1254" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/sample.png" alt="Sample" width="478" height="167" /></a>

(I've added the first row styling)

Now let's save this file three times as CSV, creating files HiveSample-1.csv, HiveSample-2.csv and HiveSample-3.csv.  Between each save, enter a value in a blank cell (at the right of the data).  This will recalculate all the random entries.  You can then hit CTRL-Z and save.

Let's push those files into your Hadoop blob container in the folder "my-data/sampled".  This is important as we'll refer to that in a typed command soon.
<h3>Hive Editor</h3>
We'll use Hive with HDInsight Hive editor.  This is a web console.

Let's open the HDInsight cluster we've created in the portal.

<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/cluster.png"><img class="alignnone size-full wp-image-1238" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/cluster.png" alt="Cluster" width="497" height="519" /></a>

In the Quick Links we find the <em>Cluster Dashboard</em>.  When we click that we're are prompted for some credentials.  This is where we have to give the cluster <em>admin</em> credentials we've entered during the setup.

<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hiveedit.png"><img class="alignnone wp-image-1239" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hiveedit.png" alt="HiveEdit" width="970" height="237" /></a>

In the top menu of the dashboard, you'll find the <em>Hive Editor</em>.  Click that and you should land on a page looking like this:

<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hiveeditdefault.png"><img class="alignnone wp-image-1240" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/hiveeditdefault.png" alt="HiveEditDefault" width="968" height="249" /></a>
<h3>Creating External Table</h3>
We're going to create an external table.  An external table in Hive is a table where only the table definition is stored in Hive ; the data is stored in its original format outside of Hive itself (in the same blob storage container though).

In the query editor, we're going to type

CREATE EXTERNAL TABLE hardware
(
rand1 double,
Widget string,
Price double,
InStock int
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
STORED AS TEXTFILE LOCATION 'wasb:///my-data/sampled/'
TBLPROPERTIES("skip.header.line.count"="1");

and hit the <em>Submit</em> button and...  wait.  You wait a lot when working with Hive unfortunately.

Hive transforms this Hive-QL query into an Hadoop Map-Reduce job and schedule the job.  Eventually your job will complete.  You can view the details of your job.  In this case the job doesn't output anything but you can see the elapsed time in the logs.

What we did here is to tell Hive to create an external table with a given schema (schema on read, more on that in a minute), parsing it using comma as the delimited field.  We tell Hive to pick all the files within the folder "my-data/sampled" and we tell it to skip the first row of each file (the header).
<h3>Sanity queries</h3>
Let's run a few queries for sanity's sake.  Let's start with a COUNT:

SELECT COUNT(*) FROM hardware

which should return you the total amount of rows in all the files you put in the folder.

and

SELECT * FROM hardware LIMIT 10

that should gives you a top 10 of the rows of the first file (yes, <em>SELECT TOP</em> is a TSQL-only instruction and isn't part of ANSI SQL neither was it picked up by anyone else including HiveQL apparently).

You can submit both queries back-to-back.  You can give them a name to more easily find them back.
<h3>Schema on read</h3>
A concept you'll hear a lot about in Hive (and in Big Data Analysis in general) is <em>Schema on read</em>.  That is opposed to <em>Schema on write</em> that we are used to in a typical SQL database.

Here the schema is used to guide the parser to interpret the data, it isn't a schema used to format the data while written to the database.

It's a subtle difference but an important one.  Schema-on-read means you wait for your analysis to impose constraints on the data.  This is quite powerful as you do not need to think in advance about the analysis you are going to do.  Well...  mostly!  You still need the information to be there in some form at least.
<h3>Slightly more complex queries</h3>
Ok, let's try some analysis of the data.  Let's group all the widget together and look at their average price and quantity:

SELECT
Widget,
AVG(Price) AS Price,
AVG (InStock) AS InStock
FROM hardware
GROUP BY Widget
ORDER BY Price

Your millage will vary given the randomness, but you should have something in the line of:

<a href="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/analysisoutput.png"><img class="alignnone size-full wp-image-1257" src="/assets/2015/10/hdinsight-hadoop-hive-csv-files-analysis/analysisoutput.png" alt="AnalysisOutput" width="555" height="158" /></a>
<h3>Optimization with Tez</h3>
The last query took 85 seconds to run in my cluster.  Remember, I did configure my cluster to have only one data node of the cheapest VM available.

Still...  to compute sums over a dataset of 300...  A tad slow.

By and large, Hadoop map reduce isn't fast, it is scalable.  It wasn't build to be fast on small data sets.  It has a file-based job scheduling architecture which incurs lots of overhead.

Nevertheless, some optimizations are readily available.

For instance, if you type

<span class="kwd">set</span><span class="pln"> hive</span><span class="pun">.</span><span class="pln">execution</span><span class="pun">.</span><span class="pln">engine</span><span class="pun">=</span><span class="pln">tez</span><span class="pun">;</span>

on top of the last query, on my cluster it runs in 36 seconds.  Less than half than without the optimization.

That is TEZ.  <a href="http://hortonworks.com/hadoop/tez/" target="_blank">TEZ</a> is built on top of <a href="http://hortonworks.com/hadoop/yarn/" target="_blank">YARN</a>.  To make a long story short, you can consider them as the Version 2 of the Hadoop Map-Reduce engine.

This works per-query so you always need to prefix your query with the set-instruction.
<h3>Summary</h3>
We've created some dummy data in Excel, saved it in CSV formats and exported it to blob storage.

We created an Hive external table reading those files.

We've queried that table to perform some analytics.

We've optimized the queries using Tez.

HDInsight / Hadoop Hive really shines when you try to perform ad hoc analytics:  you want to explore data.  If you already know that you want your quarterly average, there are better technologies suited for that (e.g. SQL Server Analytic Services).

For a more conceptual tutorial of Hive <a href="https://cwiki.apache.org/confluence/display/Hive/Tutorial" target="_blank">look here</a>.