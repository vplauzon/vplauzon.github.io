---
title:  Azure Databricks - Parsing escaping CSV files in Spark
date:  2018-02-07 11:30:56 +00:00
permalink:  "/2018/02/07/parsing-escaping-csv-files-in-spark/"
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/pexels-photo-257928.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-257928" src="assets/2018/2/parsing-escaping-csv-files-in-spark/pexels-photo-257928_thumb.jpg" alt="pexels-photo-257928" width="320" height="240" align="right" border="0" /></a><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/">In previous weeks, we’ve looked at Azure Databricks</a>, Azure’s managed Spark cluster service.

We then looked at <a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">Resilient Distributed Datasets</a> (RDDs) &amp; <a href="https://vincentlauzon.com/2018/01/24/azure-databricks-spark-sql-data-frames/">Spark SQL / Data Frames</a>.  We also looked at <a href="https://vincentlauzon.com/2018/01/31/transforming-data-frames-in-spark/">an example of more tedious transformation prior to querying</a> using the <a href="https://www.kaggle.com/nsharan/h-1b-visa">H-1B Visa Petitions 2011-2016</a> (from <a href="https://www.kaggle.com/">Kaggle</a>) data set.

Here, we’re going to look at some more involved pre-processing using the <a href="https://www.kaggle.com/rounakbanik/ted-talks/version/3">TED Talks</a> (from <a href="https://www.kaggle.com/">Kaggle</a>).  More specifically, we are going to work around Spark limitations in parsing CSV files.

It is important to note that about everything in this article <strong>isn't </strong>specific to Azure Databricks and would work with any distribution of Apache Spark.

The notebook used for this article is <a href="https://github.com/vplauzon/databricks/tree/master/ted">persisted on GitHub</a> (see <a href="https://vincentlauzon.com/2018/02/27/import-notebooks-in-databricks/">this article</a> on how to import it in your Workspace).
<h2>The Data</h2>
From <a href="https://www.kaggle.com/rounakbanik/ted-talks/version/3">Kaggle</a>:

<em>These datasets contain information about all audio-video recordings of TED Talks uploaded to the official TED.com website until September 21st, 2017. The TED main dataset contains information about all talks including number of views, number of comments, descriptions, speakers and titles. The TED transcripts dataset contains the transcripts for all talks available on TED.com.</em>

Kaggle offers data versioning so we didn’t feel we needed to copy the dataset into GitHub.  We used <a href="https://www.kaggle.com/rounakbanik/ted-talks/version/3">Version 3</a> of the dataset.

We will only work with the ted_main.csv file, which is 7Mb with 2550 rows and 17 columns.

Here are the first 12 columns:

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb6.png" alt="image" border="0" /></a>

and the last 5:

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image7.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb7.png" alt="image" border="0" /></a>
<h2>The Challenge</h2>
A first few observations:
<ul>
 	<li>There are three columns with collection of complex (JSON) data:  <em>ratings</em>, <em>related_talks</em> &amp; <em>tags</em>.</li>
 	<li>The JSON of complex columns is malformed ; more precisely, it uses single quotes instead of mandatory (according to JSON specs) double quotes ; yet, it does use double quotes for field containing single quote in the field</li>
 	<li>A few columns escape CSV by having commas and quotes within a field</li>
 	<li>Some “row” occupy two lines ; this is usually done within a quote</li>
</ul>
It basically is a pretty “hard CSV” to parse.  For those reasons, if we use the standard CSV format reader of spark session (i.e. <em>spark.read.csv(path)</em>), we won’t have what we need.

Actually, for some reason, some columns will run over others.  It seems the CSV parser of spark doesn’t fully support the CSV specs at the time of this writing (i.e. mid-January 2018).

We’ll there need to use some more low-level code to get the structure we want.
<h2>Wrangling</h2>
As in <a href="https://vincentlauzon.com/2018/01/31/transforming-data-frames-in-spark/">past articles</a>, we use Python SDK.  We make sure our <a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">cluster is configured with credentials of the storage account</a> where we copied the data.

Then, we simply point to the file in the storage account.

[code language="python"]

#  Replace with your container and storage account:  &quot;wasbs://&amp;lt;container&amp;gt;@&amp;lt;storage account&amp;gt;.blob.core.windows.net/&quot;
pathPrefix = &quot;wasbs://ted@vpldb.blob.core.windows.net/&quot;
path = pathPrefix + &quot;ted_main.csv&quot;

[/code]

We’ll then do the heavy lifting:

[code language="python"]

import csv
import StringIO

# Load the data as one big string
# We do this because Spark is unable to parse the CSV correctly due to some escaping
text = sc.wholeTextFiles(path).take(1)[0][1]
# Use Python's csv module to parse the content
lines = [v for v in csv.reader(StringIO.StringIO(text.encode('utf8', 'ignore')))]
# Take the first row as column names
columnNames = lines[0]
# Take the rest of the rows as content
content = sc.parallelize(lines[1:])
# Filter out rows that wouldn't have the right number of columns
compliant = content.filter(lambda v: len(v)==len(columnNames))
# Map list-rows to dictionaries using the column names
talkDict = compliant.map(lambda r: dict(zip(columnNames, r)))

[/code]

Since Spark CSV parser won’t work and that rows run on multiple lines, we load the entire file in memory.

We then use Python’s <em>CSV</em> module to parse the rows.  That module requires a stream, this is why we use the <em>StringIO</em> module to build a stream from a string.

We then have a list (rows) of lists (columns).  The first row contain the column names while the rest is the content.  We parallelize the content to run it on multiple nodes.

We then filter out rows with column count different than the list of column names we have.

We then create a dictionary out of each row by zipping the column names with the row content.

We will then use some Python functions to rework the content.

As mentioned previously, the JSON is malformed and won’t be read by Python’s JSON’s parser.  Fortunately, we can treat JSON as a Python dictionary which we can parse, using the <em>ast</em> module.

[code language="python"]

def parse(singleQuotedJson):
import ast

return ast.literal_eval(singleQuotedJson)

def reworkFields(d):
# Parse integers since Python's CSV parser only parse strings
d['comments'] = int(d['comments'])
d['duration'] = int(d['duration'])
d['film_date'] = int(d['film_date'])
d['num_speaker'] = int(d['num_speaker'])
d['published_date'] = int(d['published_date'])
d['views'] = int(d['views'])

# Parse json columns (into dictionaries)
d['ratings'] = parse(d['ratings'])
d['related_talks'] = parse(d['related_talks'])
d['tags'] = parse(d['tags'])

return d

def cleanDenormalizedAttributes(dict):
# Remove denormalized properties
del(dict['ratings'])
del(dict['related_talks'])
del(dict['tags'])

return dict

[/code]

On top of parsing the JSON, the rework function also force some fields to be integer (Python’s CSV parser parses everything in string).

[code language="python"]

# Rework some fields
cleanFields = talkDict.map(lambda r: reworkFields(r))
# Extract ratings as a separate RDD linked to the talks one with the talk name
ratings = cleanFields.flatMap(lambda d: [{'talkName':d['name'], 'id':r['id'], 'name':r['name'], 'count':r['count']} for r in d['ratings']])
# Extract related talks, similarly linked to talk name
relatedTalks = cleanFields.flatMap(lambda d: [{'talkName':d['name'], 'relatedTalkName':r['title']} for r in d['related_talks']])
# Extract tags, similarly linked to talk name
tags = cleanFields.flatMap(lambda d: [{'talkName':d['name'], 'tag':t} for t in d['tags']])
# Normalize the talkDict by removing denormalized attributes
normalizedTalks = cleanFields.map(lambda d:  cleanDenormalizedAttributes(d))

[/code]

We first rework the data content.  We then extract the three complex fields as different Resilient Distributed Datasets (RDDs).  We then remove the data used for those 3 new RDDs from the original RDD.

We basically normalized the data.  Spark supports having complex field, so we could have kept everything within one data set.  We did experience difficulties trying that (e.g. the <em>name</em> property in <em>ratings</em> would be <em>null</em> everywhere for some reasons), so we went with the simpler approach of normalization.

We then create data frames from each RDD and register those data frames as temporary view to be used by SQL.

We also cache the data frames so that subsequent queries won’t recalculate them each time.

[code language="python"]

from pyspark.sql import Row

# Create data frames, cache them and register them as temp views
normalizedTalksDf = spark.createDataFrame(normalizedTalks.map(lambda d: Row(**d)))
normalizedTalksDf.cache()
normalizedTalksDf.createOrReplaceTempView(&quot;talks&quot;)

ratingsDf = spark.createDataFrame(ratings.map(lambda d: Row(**d)))
ratingsDf.cache()
ratingsDf.createOrReplaceTempView(&quot;ratings&quot;)

relatedTalksDf = spark.createDataFrame(relatedTalks.map(lambda d: Row(**d)))
relatedTalksDf.cache()
relatedTalksDf.createOrReplaceTempView(&quot;relatedTalks&quot;)

tagsDf = spark.createDataFrame(tags.map(lambda d: Row(**d)))
tagsDf.cache()
tagsDf.createOrReplaceTempView(&quot;tags&quot;)

[/code]

We here have a much meatier pre-processing of the data than we had in previous articles.  This is still simple as the data itself is clean (i.e. there aren’t missing data or malformed fields per se).

Going back to RDD serves us well as we have a much better control to that level.  If the file was too big to be hold in memory, we would have had a challenge.  On the other hand, treating multiple files that way would have been trivial.
<h2>Insights</h2>
First, let’s check the size of each data frames:

[code language="sql"]

%sql

SELECT
(
SELECT COUNT(*)
FROM talks
) AS talkCount,
(
SELECT COUNT(*)
FROM ratings
) AS ratingTalkCount,
(
SELECT COUNT(*)
FROM relatedTalks
) AS relatedTalkCount,
(
SELECT COUNT(*)
FROM tags
) AS tagCount

[/code]

This gives use the following cardinalities:

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image8.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb8.png" alt="image" border="0" /></a>

So despite the small number of Ted Talks covered, the file does contain a good chunk of data.

We can then ask what is the top ten talks, using the number of views as the success factor.  We could try to see if a talk that is viewed a lot generate a lot of comments ; for this, we’ll compare the number of comments with the number of view:

[code language="sql"]

%sql

SELECT title, main_speaker, views, ROUND(1000000*comments/views, 1) AS commentsPerMillionViews
FROM talks
ORDER BY views DESC
LIMIT 10

[/code]

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb9.png" alt="image" border="0" /></a>

In general, it seems that well viewed talks generate a lot of comments.

Let’s look at tags and ask which tags are associated to popular talks:

[code language="sql"]

%sql

SELECT ROUND(AVG(t.views)) as avgViews, tg.tag
FROM talks AS t
INNER JOIN tags tg ON tg.talkName=t.name
GROUP BY tg.tag
ORDER BY avgViews DESC

[/code]

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb10.png" alt="image" border="0" /></a>

Apparently <em>body language</em> is the way to go to be popular at <em>TED</em>.

Let’s then check the ratings.  Ratings are a little more complicated to analyze since for one specific talk there will be multiple ratings of different categories.

Let’s first look at the ratings in order of ratings’ number (not talks view, but the number of time the same category was given).

[code language="sql"]

%sql

SELECT name, SUM(count) AS ratingCount
FROM ratings
GROUP BY name
ORDER BY ratingCount DESC

[/code]

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb11.png" alt="image" border="0" /></a>

So inspiring speech are rated often.  This is consistent with our experience of TED speeches.

Finally, let’s try to dig a little further in the ratings.  Since <em>Inspiring</em> is the most often rated rating, let’s rank the talks in order of those that received that rating the most often:

[code language="sql"]

%sql

SELECT t.title, t.main_speaker, t.views, r.count
FROM talks AS t
INNER JOIN ratings AS r ON r.talkName = t.name AND r.name=&quot;Inspiring&quot;
ORDER BY r.count DESC

[/code]

<a href="assets/2018/2/parsing-escaping-csv-files-in-spark/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/2/parsing-escaping-csv-files-in-spark/image_thumb12.png" alt="image" border="0" /></a>

We see that in general, the <em>Inspiring</em> rating is a good predictor of a talk’s popularity but that it doesn’t reproduce the entire top 10 in the right order (e.g. the fourth talk here was second in terms of views).
<h2>Summary</h2>
We went a bit further in terms of preprocessing of files using Python and RDDs.

It shows a great power of Spark, one we appreciate in good Framework:  easy cases are easy because you treat them in the highest abstraction level ; but harder cases are just as hard as they need to be.  We didn’t need to work around the Spark abstractions:  we simply went a level down (i.e. RDD), solve the problem and popped back up to the data frame abstraction.