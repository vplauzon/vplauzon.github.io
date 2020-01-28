---
title: Azure Databricks - Spark SQL - Data Frames
date: 2018-01-24 03:30:51 -08:00
permalink: /2018/01/24/azure-databricks-spark-sql-data-frames/
categories:
- Solution
tags:
- Big Data
- Data
---
<img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-411089 (1)" src="/assets/posts/2018/1/azure-databricks-spark-sql-data-frames/pexels-photo-411089-1.jpg" alt="pexels-photo-411089 (1)" width="320" height="213" align="right" border="0" /><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/">We looked at Azure Databricks</a> a few weeks ago.

Azure Databricks is a managed Apache Spark Cluster service.

<a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">More recently we looked at how to analyze a data set using Resilient Distributed Dataset (RDD)</a>.  We used the <a href="http://bioinfo.uib.es/~joemiro/marvel.html">Social characteristics of the Marvel Universe</a> public dataset, replicating <a href="https://vincentlauzon.com/2016/01/13/azure-data-lake-analytics-loading-files-with-custom-c-code/">some experiments we did 2 years ago with Azure Data Lake</a>.

In this article, we are going to do the same analysis using Spark SQL &amp; Data Frames and see how it addresses RDDs’ shortcomings.  Again, we are going to use the Python SDK but also SQL.

It is important to note that about everything in this article <strong>isn't</strong> specific to Azure Databricks and would work with any distribution of Apache Spark.
<h2>Spark SQL &amp; Data Frames</h2>
<img style="border:0 currentcolor;float:left;display:inline;background-image:none;" src="/assets/posts/2018/1/azure-databricks-spark-sql-data-frames/databricks_logo1.png" align="left" border="0" />

Spark SQL &amp; Data Frames is well documented on the <a href="https://spark.apache.org/docs/latest/sql-programming-guide.html" target="_blank" rel="noopener">Apache Spark online documentation</a>.  They defined Spark SQL in those words:

<em>“Spark SQL is a Spark module for structured data processing. Unlike the basic Spark RDD API, the interfaces provided by Spark SQL provide Spark with more information about the structure of both the data and the computation being performed. Internally, Spark SQL uses this extra information to perform extra optimizations.”</em>

Keywords here:
<ul>
 	<li>Structured data</li>
 	<li>Extra information about data structure</li>
 	<li>Extra optimizations using that extra information</li>
</ul>
With RDD we are able to parse files with little structure and process them.  We can process files with structure but as the experiment we’ll do will make amply clear, it is nowhere as efficient as Data Frames with structured Data.

Typically we use RDD to take unstructured data and either get insights directly from it or transform it into a shape that can be used by other components:  Spark SQL or Data Warehouses (e.g. Azure SQL Data Warehouse).
<h2>Azure Databricks Workspace setup</h2>
The setup is the same than in <a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">our RDD article</a>.

We still need a workspace, a cluster configured to connect to a storage account containing our data file.

We recommend cloning the notebook used in the previous article since the beginning is very similar.
<h2>Loading the data:  RDDs</h2>
We’ll first load the data.  This is identical to our previous article and we use RDDs:

```python


#  Fetch porgat.txt from storage account
pathPrefix = "wasbs://<span style="display: inline !important; float: none; background-color: transparent; color: #333333; cursor: text; font-family: Georgia,'Times New Roman','Bitstream Charter',Times,serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-decoration: none; text-indent: 0px; text-transform: none; -webkit-text-stroke-width: 0px; white-space: normal; word-spacing: 0px;"><CONTAINER>@<STORAGE ACCOUNT></span>/"
file = sc.textFile(pathPrefix + "porgat.txt")
```

To ensure future compatibility, we did <a href="https://github.com/vplauzon/databricks/tree/master/dataframes">copy the dataset in GitHub</a>, along with the notebook <span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> (see </span><a href="https://vincentlauzon.com/2018/02/27/import-notebooks-in-databricks/">this article</a><span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> on how to import it in your Workspace)</span>.

The placeholders CONTAINER and STORAGE ACCOUNT are for the name of the container where we copied the file and the name of the storage account owning that container.

Then let’s transform the data.  Remember that all the three RDDs (i.e. characters, publications &amp; relationships) are all coming from a single file.

```python


#  Remove the headers from the file:  lines starting with a star
noHeaders = file.filter(lambda x: len(x)&gt;0 and x[0]!='*')
#  Extract a pair from each line:  the leading integer and a string for the rest of the line
paired = noHeaders.map(lambda l:  l.partition(' ')).filter(lambda t:  len(t)==3 and len(t[0])&gt;0 and len(t[2])&gt;0).map(lambda t: (int(t[0]), t[2]))
#  Filter relationships as they do not start with quotes, then split the integer list
scatteredRelationships = paired.filter(lambda (charId, text):  text[0]!='"').map(lambda (charId, text): (charId, [int(x) for x in text.split(' ')]))
#  Relationships for the same character id sometime spans more than a line in the file, so let's group them together
relationships = scatteredRelationships.reduceByKey(lambda pubList1, pubList2: pubList1 + pubList2)
#  Filter non-relationships as they start with quotes ; remove the quotes
nonRelationships = paired.filter(lambda (index, text):  text[0]=='"').map(lambda (index, text):  (index, text[1:-1].strip()))
#  Characters stop at a certain line (part of the initial header ; we hardcode it here)
characters = nonRelationships.filter(lambda (charId, name): charId&lt;=6486)
#  Publications starts after the characters
publications = nonRelationships.filter(lambda (charId, name): charId&gt;6486)

```

Comments explain what each line does.
<h2>Transitioning to Spark SQL:  Data Frames</h2>
Spark SQL work with Data Frames which are a kind of “structured” RDD or an “RDD with schema”.

The integration between the two works by creating a RDD of <em>Row</em> (a type from <em>pyspark.sql</em>) and then creating a Data Frame from it.

The Data Frames can then be registered as views.  It is those views we’ll query using Spark SQL.

```python


from pyspark.sql import Row

#  Let's create dataframes out of the RDDs and register them as temporary views for SQL to use

#  Relationships has a list as a component, let's flat that
flatRelationships = relationships.flatMap(lambda (charId, pubList):  [(charId, pubId) for pubId in pubList])
#  Let's map the relationships to an RDD of rows in order to create a data frame out of it
relationshipsDf = spark.createDataFrame(flatRelationships.map(lambda t: Row(charId=t[0], pubId=t[1])))
#  Register relationships as a temporary view
relationshipsDf.createOrReplaceTempView("relationships")

#  Let's do the same for characters
charactersDf = spark.createDataFrame(characters.map(lambda t:  Row(charId=t[0], name=t[1])))
charactersDf.createOrReplaceTempView("characters")

#  and for publications
publicationsDf = spark.createDataFrame(publications.map(lambda t:  Row(pubId=t[0], name=t[1])))
publicationsDf.createOrReplaceTempView("publications")

```

We could easily come back to a RDD object with, for instance, <em>publicationsDf.rdd</em>.
<h2>Querying using Spark SQL</h2>
Using our Python Notebook, we’ll now transition to SQL.

We can mix languages in the Notebook, as <a href="https://docs.azuredatabricks.net/user-guide/notebooks/index.html#mixing-languages-in-a-notebook" target="_blank" rel="noopener">the online documentation explains</a>, by simply starting a command with %&lt;language&gt;.  In this case we start with <em>%sql</em>.

```sql


%sql

SELECT c1.name AS name1, c2.name AS name2, sub.charId1, sub.charId2, sub.pubCount
FROM
(
SELECT r1.charId AS charId1, r2.charId AS charId2, COUNT(r1.pubId, r2.pubId) AS pubCount
FROM relationships AS r1
CROSS JOIN relationships AS r2
WHERE r1.charId &lt; r2.charId
AND r1.pubId=r2.pubId
GROUP BY r1.charId, r2.charId
) AS sub
INNER JOIN characters c1 ON c1.charId=sub.charId1
INNER JOIN characters c2 ON c2.charId=sub.charId2
ORDER BY sub.pubCount DESC
LIMIT 10

```

Here we see the power of Spark SQL.  No longer do we have strange manipulation of RDDs where we flipped the data around to have some item in first position in order to sort or group it.  We have plain SQL playing with the data in a very natural manner.

It is also extremely fast compare to the RDD code from our last article performing the same work and giving the same results.

That code ranks Marvel characters in duo in order of join-appearances in publications.  Here is the code ranking trios:

```sql


%sql

SELECT c1.name AS name1, c2.name AS name2, c3.name AS name3, sub.charId1, sub.charId2, sub.charId3, sub.pubCount
FROM
(
SELECT r1.charId AS charId1, r2.charId AS charId2, r3.charId AS charId3, COUNT(r1.pubId, r2.pubId, r3.pubId) AS pubCount
FROM relationships AS r1
CROSS JOIN relationships AS r2
CROSS JOIN relationships AS r3
WHERE r1.charId &lt; r2.charId
AND r2.charId &lt; r3.charId
AND r1.pubId=r2.pubId
AND r2.pubId=r3.pubId
GROUP BY r1.charId, r2.charId, r3.charId
) AS sub
INNER JOIN characters c1 ON c1.charId=sub.charId1
INNER JOIN characters c2 ON c2.charId=sub.charId2
INNER JOIN characters c3 ON c3.charId=sub.charId3
ORDER BY sub.pubCount DESC
LIMIT 10

```

Not much more complex nor longer to execute.

We didn’t do that exercise with the RDD because it looked extremely tedious to do.  This is a good indicator of the power of a tool where you can do things that seemed “way too complex” with another one.
<h2>Summary</h2>
On the surface Spark SQL looks like semantic sugar on top of RDD.

We hope the example we gave convinced you otherwise.  Spark SQL is more concise, easy to read and faster to run by an order of magnitude.

That being said, it doesn’t mean we shouldn’t use RDDs.  RDDs have their place with unstructured data or data preparation.  Spark SQL isn’t useful in those cases.

We barely scratched the surface here.  For instance, Spark SQL can deal with hierarchical data (e.g. JSON) which didn’t show here.