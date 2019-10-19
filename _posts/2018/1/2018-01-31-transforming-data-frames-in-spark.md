---
title:  Azure Databricks - Transforming Data Frames in Spark
date:  2018-01-31 18:30:24 -05:00
permalink:  "/2018/01/31/transforming-data-frames-in-spark/"
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="assets/2018/1/transforming-data-frames-in-spark/pexels-photo-354939.jpg"><img style="margin:0;border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-354939" src="assets/2018/1/transforming-data-frames-in-spark/pexels-photo-354939_thumb.jpg" alt="pexels-photo-354939" width="240" height="160" align="right" border="0" /></a><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/" target="_blank" rel="noopener">In previous weeks, we’ve looked at Azure Databricks</a>, Azure’s managed Spark cluster service.

We then looked at <a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">Resilient Distributed Datasets</a> (RDDs) &amp; <a href="https://vincentlauzon.com/2018/01/24/azure-databricks-spark-sql-data-frames/">Spark SQL / Data Frames</a>.

We wanted to look at some more Data Frames, with a bigger data set, more precisely some transformation techniques.  We often say that <a href="https://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/" target="_blank" rel="noopener">most of the leg work in Machine learning in data cleansing</a>.  Similarly we can affirm that the clever &amp; insightful aggregation query performed on a large dataset can only be executed after a considerable amount of work has been done into formatting, filtering &amp; massaging data:  data wrangling.

Here, we’ll look at an interesting dataset, the <a href="https://www.kaggle.com/nsharan/h-1b-visa" target="_blank" rel="noopener">H-1B Visa Petitions 2011-2016</a> (from <a href="https://www.kaggle.com" target="_blank" rel="noopener">Kaggle</a>) and find some good insights with just a few queries, but also some data wrangling.

It is important to note that about everything in this article <strong>isn't</strong> specific to Azure Databricks and would work with any distribution of Apache Spark.

The notebook used for this article is <a href="https://github.com/vplauzon/databricks/tree/master/h1b-visa">persisted on GitHub</a> <span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> (see </span><a href="https://vincentlauzon.com/2018/02/27/import-notebooks-in-databricks/">this article</a><span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> on how to import it in your Workspace)</span>.
<h2>The Data</h2>
<a href="https://www.kaggle.com/nsharan/h-1b-visa/version/2" target="_blank" rel="noopener">From Kaggle</a>:

<em>H-1B is an employment-based, non-immigrant visa category for temporary foreign workers in the United States. For a foreign national to apply for H1-B visa, an US employer must offer a job and petition for H-1B visa with the US immigration department. This is the most common visa status applied for and held by international students once they complete college/ higher education (Masters, PhD) and work in a full-time position.</em>

Kaggle offers data versioning so we didn’t feel we needed to copy the dataset into GitHub.  We used <a href="https://www.kaggle.com/nsharan/h-1b-visa/version/2" target="_blank" rel="noopener">Version 2</a> of the dataset.

The data set is contained in a single CSV file of 0.5GB.  It has few columns but a large number of rows (3 million):

<a href="assets/2018/1/transforming-data-frames-in-spark/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb.png" alt="image" border="0" /></a>
<h2>The Challenges</h2>
We can notice a couple of cosmetic aspects that warrant some light wrangling:
<ul>
 	<li>The ID column simply doesn’t have a name in the CSV file</li>
 	<li>The <em>WORKSITE </em>column contains a city and a state with a comma separating them ; this is denormalized data and it can be useful to look at state or city separately (and we will)</li>
 	<li>The <em>FULL_TIME_POSITION</em> has values ‘Y’ and ‘N’ ; it should be a boolean</li>
</ul>
<h2>Wrangling</h2>
As in <a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">past articles</a>, we use Python SDK.  We make sure our cluster is configured with credentials of the storage account where we copied the data.

Then, we simply point to the file in the storage account.

[code language="python"]

#  Replace with your container and storage account:  &quot;wasbs://&amp;lt;container&amp;gt;@&amp;lt;storage account&amp;gt;.blob.core.windows.net/&quot;
pathPrefix = &quot;wasbs://hb1-visa@vpldb.blob.core.windows.net/&quot;
path = pathPrefix + &quot;h1b_kaggle.csv&quot;
# Load CSV
df = spark.read.option(&quot;header&quot;,&quot;true&quot;).csv(path)

[/code]

Here we use the spark session to load the data as a Data Frame.  The spark context is used to manipulate RDDs while the session is used for Spark SQL.  Each interface offer different load methods with the Spark Context offering more high level methods.

Here we load the CSV file as a CSV, interpreting its header row and inferring the schema given the data present in each column.

CSV load works well but we want to rework some columns.  For that we’ll flip back to an RDD representation.  To pass from a Data Frame <em>df</em> to its RDD representation we can simply use <em>df.rdd</em>.

That RDD will be an RDD of <em>Row </em>(i.e. strong typed).  A <em>Row</em> is a read-only object which makes it cumbersome to manipulate as we need to repeat each existing column.  An easier way to manipulate it is to use a Python dictionary representation.

So we define the following Python method to manipulate a row:

[code language="python"]

# Manipulate a data-row to change some columns
def reworkRow(row):
from pyspark.sql import Row

# Let's convert the data row to a dictionary
# This is easier to manipulate as the dictionary isn't readonly
dict = row.asDict()

# Change the first column from _co to id
dict['id'] = dict['_c0']
del(dict['_c0'])

# Split the WORKSITE column into city &amp;amp; state
worksite = dict['WORKSITE'].split(',')
city = worksite[0].strip() if len(worksite)&amp;gt;0 else None
state = worksite[1].strip() if len(worksite)&amp;gt;1 else None
dict['CITY'] = city
dict['STATE'] = state
del(dict['WORKSITE'])

# Change FULL_TIME _POSITION column from 'Y' and 'N' to True / False (boolean)
dict['FULL_TIME_POSITION'] = True if dict['FULL_TIME_POSITION']=='Y' else False

return Row(**dict)

[/code]

We address the three changes we wanted to address:  id column, worksite column &amp; full time position column.

We can then simply do a <em>map</em> on the RDD and recreate a data frame from the mapped RDD:

[code language="python"]

# Convert back to RDD to manipulate the rows
rdd = df.rdd.map(lambda row: reworkRow(row))
# Create a dataframe with the manipulated rows
hb1 = spark.createDataFrame(rdd)
# Let's cache this bad boy
hb1.cache()
# Create a temporary view from the data frame
hb1.createOrReplaceTempView(&quot;hb1&quot;)

[/code]

We cached the data frame.  Since the data set is 0.5GB on disk, it is useful to keep it in memory.  The <em>.cache</em> method does a best effort job of keeping the data in the RAM of the worker nodes.  This means that from one query to the next, the dataframe isn’t fully reconstructed.  It does improve the performance drastically as we can easily test by commenting that command out.

We also register the data frame as a temporary view so we can use it in SQL.

This is the extend of wrangling we do with this data set.  Nothing very complicated, but as it often is the case, we do more than just load the CSV and query on it.
<h2>Insights</h2>
First, let’s check the size of the data set:

[code language="sql"]

%sql
SELECT COUNT(*)
FROM hb1

[/code]

This gives us a count of 3 002 458, which is a good size data set.

We can then check which state are most popular for immigration requests in the USA:

[code language="sql"]

%sql
SELECT STATE, COUNT(*) AS petitions
FROM hb1
GROUP BY STATE
ORDER BY petitions DESC

[/code]

The result is our first insight:

<a href="assets/2018/1/transforming-data-frames-in-spark/image1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb1.png" alt="image" border="0" /></a>

California being on top isn’t surprising.  Texas being second is a little more interesting, although since it is followed by New York &amp; New Jersey, it is questionable if those two aren’t both related to New York City’s attraction power, so together they would be 2nd.

If we breakdown by city, a different immigration portrait appears:

[code language="sql"]

%sql
SELECT CITY, STATE, COUNT(*) AS petitions
FROM hb1
GROUP BY CITY, STATE
ORDER BY petitions DESC

[/code]

<a href="assets/2018/1/transforming-data-frames-in-spark/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb2.png" alt="image" border="0" /></a>

Indeed, New York takes the lion share and Houston comes 2nd.  Atlanta comes 4th while the state of Georgia was 9th.

This is a great example of drill down to better understand the data.

We could have a look at the distribution of the <em>case status</em>:

[code language="sql"]

%sql
SELECT CASE_STATUS, COUNT(*) AS petitions
FROM hb1
GROUP BY CASE_STATUS
ORDER BY petitions DESC

[/code]

<a href="assets/2018/1/transforming-data-frames-in-spark/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb3.png" alt="image" border="0" /></a>

A surprisingly low level of rejection.

Let’s look at the employers sponsoring those visas.

[code language="sql"]

%sql
SELECT EMPLOYER_NAME, COUNT(*) as count
FROM hb1
GROUP BY EMPLOYER_NAME
ORDER BY count DESC
LIMIT 20

[/code]

We see that the top of employers is dominated by the IT industry.

<a href="assets/2018/1/transforming-data-frames-in-spark/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb4.png" alt="image" border="0" /></a>

Looking at the job title of applicants corroborates the dominance of the IT industry:

[code language="sql"]

%sql
SELECT JOB_TITLE, COUNT(*) AS count
FROM hb1
GROUP BY JOB_TITLE
ORDER BY count DESC
LIMIT 20

[/code]

<a href="assets/2018/1/transforming-data-frames-in-spark/image5.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/1/transforming-data-frames-in-spark/image_thumb5.png" alt="image" border="0" /></a>

We could query further to understand how the IT industry structure this data set.

Those were just a few queries using aggregations.  Since the underlying data frame is cached, they run very fast:  in a few seconds.
<h2>Summary</h2>
We wanted to show how to first load a CSV data set to then pre process it a little to change some of its characteristics.

Here we “normalized” a field, i.e. we split the state from city in two columns.  We renamed the id-field.  Finally, we re-interpreted the <em>full time position</em> field into a boolean.

In our case we do this with only one file, but we could just as easily have done it on multiple files.

We chose to do those modifications using the RDD interface.  We could have done it using the data frame interface or even in SQL.  We found it more natural to do it in the RDD.