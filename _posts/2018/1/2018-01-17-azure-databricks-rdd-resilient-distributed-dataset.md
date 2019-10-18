---
title:  Azure Databricks - RDD - Resilient Distributed Dataset
date:  01/17/2018 11:30:45
permalink:  "/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/"
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="assets/2018/1/azure-databricks-rdd-resilient-distributed-dataset/pexels-photo-7569011.jpg"><img style="float:right;display:inline;background-image:none;" title="pexels-photo-756901[1]" src="assets/2018/1/azure-databricks-rdd-resilient-distributed-dataset/pexels-photo-7569011_thumb.jpg" alt="pexels-photo-756901[1]" width="324" height="212" align="right" border="0" /></a><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/" target="_blank" rel="noopener">We looked at Azure Databricks</a> a few weeks ago.  Azure Databricks is a managed Apache Spark Cluster service.

In this article, we are going to look at &amp; use a fundamental building block of Apache Spark:  Resilient Distributed Dataset or RDD.  We are going to use the Python SDK.

It is important to note that about everything in this article <strong>isn't</strong> specific to Azure Databricks and would work with any distribution of Apache Spark.

We are going to replicate <a href="https://vincentlauzon.com/2016/01/13/azure-data-lake-analytics-loading-files-with-custom-c-code/" target="_blank" rel="noopener">some experiments we did 2 years ago with Azure Data Lake</a>.  We are going to use the <a href="http://bioinfo.uib.es/~joemiro/marvel.html" target="_blank" rel="noopener">Social characteristics of the Marvel Universe</a> public dataset.
<h2>Create an Azure Databricks' workspace</h2>
<img style="float:left;display:inline;" src="https://vincentlauzon.files.wordpress.com/2017/12/databricks_logo1.png" align="left" />Let’s start by creating an Azure Databricks workspace.  This is well covered in the <a href="https://docs.microsoft.com/en-us/azure/azure-databricks/quickstart-create-databricks-workspace-portal" target="_blank" rel="noopener">quickstart article of the online documentation</a>, so we won’t repeat that here.

From there we will go in the workspace and create a cluster, which is also covered in the same online documentation’s article.

From there, we will create a notebook, choosing Python language, and attach it to the cluster we just created.
<h2>Storage</h2>
From here on, we’ll deviate from the online documentation quickstart’s article.  The reason is the article is using Spark SQL, which we’ll cover in a future article.

Let’s create a storage account and a container within its blob storage.  Let’s copy the only <a href="http://bioinfo.uib.es/~joemiro/marvel/porgat.txt" target="_blank" rel="noopener">data file we are going to use</a> in that container.

To ensure future compatibility, we did <a href="https://github.com/vplauzon/databricks/tree/master/rdds">copy the dataset in GitHub</a>, along with the notebook <span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> (see </span><a href="https://vincentlauzon.com/2018/02/27/import-notebooks-in-databricks/">this article</a><span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;"> on how to import it in your Workspace)</span>.

Now we need to somehow give access to that container to our cluster.

We do that by configuring the cluster.  This is covered in the <a href="https://docs.azuredatabricks.net/spark/latest/data-sources/azure/azure-storage.html" target="_blank" rel="noopener">Azure Storage data source for Azure Databricks article</a>.  Please note that the configuration using <em>spark.conf.set(...)</em> wouldn’t work with RDD, so we need to use the on-cluster configuration.
<p align="left">We can either configure access keys or SAS token.  For demo / quick learn purposes, access keys are faster to configure.  In general, SAS token are more secure since they provide less privilege and are limited in time.</p>

<h2 align="left">The Data</h2>
<p align="left">Let’s look at the data.</p>
<p align="left">The file is in three parts:</p>

<ul>
 	<li>
<div align="left">Marvel characters</div></li>
 	<li>
<div align="left">Publications</div></li>
 	<li>
<div align="left">Relationship between the two</div></li>
</ul>
<p align="left">Those three parts are following each other which will make our data retrieval more convoluted than usual.  We could have pre-process the file in a word processor beforehand since the entire file is less than a Mb.  But it’s a good exercise to work with the file directly since we wouldn’t have that option with multiple big files.</p>
<p align="left">So the first part looks like this:</p>


[code language="Python"]
*Vertices 19428 6486
1 &quot;24-HOUR MAN/EMMANUEL&quot;
2 &quot;3-D MAN/CHARLES CHAN&quot;
3 &quot;4-D MAN/MERCURIO&quot;
4 &quot;8-BALL/&quot;
5 &quot;A&quot;
6 &quot;A'YIN&quot;
7 &quot;ABBOTT, JACK&quot;
8 &quot;ABCISSA&quot;
9 &quot;ABEL&quot;

[/code]

<p align="left">The header, i.e. first row, starting with an <em>asterisk</em> or <em>star</em> is telling us there are 6486 characters.  Indeed, if we find the first occurrence of ‘6486’, we see we go back to letter ‘A’:</p>


[code language="Python"]
6484 &quot;STORMER&quot;
6485 &quot;TIGER WYLDE&quot;
6486 &quot;ZONE&quot;
6487 &quot;AA2 35&quot;
6488 &quot;M/PRM 35&quot;
6489 &quot;M/PRM 36&quot;
6490 &quot;M/PRM 37&quot;
6491 &quot;WI? 9&quot;
6492 &quot;AVF 4&quot;
[/code]

<p align="left">This is where the publications start.</p>
<p align="left">The header also told us there were 19428 publications.  If we fast forward to 19428, we see a new header, <em>Edgeslist</em>:</p>


[code language="Python"]
19427 &quot;AA2 20&quot;
19428 &quot;AA2 38&quot;
*Edgeslist
1 6487
2 6488 6489 6490 6491 6492 6493 6494 6495 6496
3 6497 6498 6499 6500 6501 6502 6503 6504 6505
4 6506 6507 6508

[/code]

<p align="left">Although it looks like every line represents a character ID followed by a list of publication ID, some characters spawn two lines and their character ID is repeated.  For instance character <em>10</em>:</p>


[code language="Python"]
10 6521 6522 6523 6524 6525 6526 6527 6528 6529 6530 6531 6532 6533 6534 6535
10 6536 6537 6538 6539 6540 6541 6542 6543 6544 6545 6546 6547 6548 6549 6550
10 6551 6552 6553 6554 6555 6556 6557 6558 6559 6560 6561 6562 6563 6564 6565

[/code]

<p align="left">That is about it.</p>
<p align="left">Dataset coming in text file often have bizarre and unique format.  Spark has good tools to deal with it.</p>
<p align="left">The only challenge, and this is typical for Big Data tools, is to deal with pieces of files sewed together.  Big Data platform typically parallelize the treatment of file and it’s actually difficult and sometimes impossible to get a hold on the row number.</p>
<p align="left">In this case, it’s easier to notice that publication start at a certain ID range (i.e. 6487).  This make it easy to filter characters and publications.</p>
<p align="left">Now the relationships use the character IDs, so they start over.  We can notice, though, that relationships do not have quotes while both characters and publications do.  This is how we’re going to differentiate them.</p>

<h2 align="left">Notebook</h2>
<p align="left">In the notebook, let’s simply copy this in the first</p>


[code language="Python"]
#  Fetch porgat.txt file from storage account
pathPrefix = &quot;wasbs://&lt;CONTAINER&gt;@&lt;STORAGE ACCOUNT&gt;.blob.core.windows.net/&quot;
file = sc.textFile(pathPrefix + &quot;porgat.txt&quot;)

[/code]

The placeholders CONTAINER and STORAGE ACCOUNT are for the name of the container where we copied the file and the name of the storage account owning that container we created earlier.

“wasbs” stands for <em>Windows Azure Storage Blob</em>.  This was created before Windows Azure was rebranded Microsoft Azure.  It is an HDFS interface to Azure Blob Storage.  This will work because we configure the cluster with access key or SAS token of the blob storage.

The second line doesn’t load the data yet.  It is merely a pointing to it.

All the Python-Spark knowledge required to understand the following is in the <a href="https://spark.apache.org/docs/latest/rdd-programming-guide.html" target="_blank" rel="noopener">Apache Spark online documentation of RDD</a>.  The documentation is well structured.

First, let’s define the different RDDs we are going to work on.  In a new cell of the Notebook, let’s paste:

[code language="Python"]

#  Remove the headers from the file:  lines starting with a star
noHeaders = file.filter(lambda x: len(x)&gt;0 and x[0]!='*')
#  Extract a pair from each line:  the leading integer and a string for the rest of the line
paired = noHeaders.map(lambda l:  l.partition(' ')).filter(lambda t:  len(t)==3 and len(t[0])&gt;0 and len(t[2])&gt;0).map(lambda t: (int(t[0]), t[2]))
#  Filter relationships as they do not start with quotes, then split the integer list
scatteredRelationships = paired.filter(lambda (charId, text):  text[0]!='&quot;').map(lambda (charId, text): (charId, [int(x) for x in text.split(' ')]))
#  Relationships for the same character id sometime spans more than a line in the file, so let's group them together
relationships = scatteredRelationships.reduceByKey(lambda pubList1, pubList2: pubList1 + pubList2)
#  Filter non-relationships as they start with quotes ; remove the quotes
nonRelationships = paired.filter(lambda (index, text):  text[0]=='&quot;').map(lambda (index, text):  (index, text[1:-1].strip()))
#  Characters stop at a certain line (part of the initial header ; we hardcode it here)
characters = nonRelationships.filter(lambda (charId, name): charId&lt;=6486) #  Publications starts after the characters publications = nonRelationships.filter(lambda (charId, name): charId&gt;6486)

[/code]

When we run that, nothing gets computed and it returns quickly.  This is because Spark uses lazy-evaluation and we just defined transformations so far.

The comments explain what each line is doing.  At the end of the block we have the three RDDs we were looking for in a proper format:
<ul>
 	<li><em>relationships</em>, where each row is key-value with the character ID as the key and the list of publication IDs as the value</li>
 	<li><em>characters</em>, also key-value with character ID / name</li>
 	<li><em>publications</em>, also key-value with publication ID / name</li>
</ul>
We can now do some work with those RDDs.
<h2>Data crunching</h2>
Let’s find out what 2 characters appear more often together in publications.

For this, we’ll take the relationship RDD and perform a Cartesian product on it and then do some filtering to get every character combination possible and the list of publications common to both of them.

Although the relationship dataset isn’t big, performing a Cartesian product will square its size.  This will bring the compute requirement where it will take a few seconds to compute.

[code language="Python"]

#  Let's find the characters appearing together most often

#  Let's take the relationship RDD and do a cartesian product with itself all possible duos ; we repartition to be able to scale
product = relationships.repartition(100).cartesian(relationships)
#  Let's then remap it to have the character ids together and intersect their publications (using Python's sets)
remapped = product.map(lambda ((charId1, pubList1), (charId2, pubList2)): ((charId1, charId2), list(set(pubList1) &amp; set(pubList2))))
#  Let's eliminate doublons
noDoublons = remapped.filter(lambda ((charId1, charId2), pubList): charId1&lt;charId2) #  Let's remove empty publication list noEmptyPublications = noDoublons.filter(lambda ((charId1, charId2), pubList): len(pubList)&gt;0)
#  Let's flip the mapping in order to sort by length of publications &amp; drop the publication lists themselves
sorted = noEmptyPublications.map(lambda ((charId1, charId2), pubList): (len(pubList), (charId1, charId2))).sortByKey(False)
#  Action:  let's output the first 10 results
top10 = sorted.take(10)

[/code]

The last line is an action.  Spark lazy computing gives up and the cluster will finally get a job to run.  The job will be divided into tasks deployed into executors on different nodes of the cluster.

Again the comments detail what’s happening on each line.

At the end we crunched a top 10 but we didn’t display yet.  This is because those are all IDs which aren’t interesting to look at.

It is going to be much more interesting to look at the name of the characters.  For that we will join with the character RDD.

Although we could have join before taking the top 10, that would have meant we would have join on <strong>every record</strong> and carry the name of the characters around which would have been heavier.  Instead, we first take the top 10, then perform the join on it, which is very fast:

[code language="Python"]
# Join once for the first character ; we first need to flip the RDD to have charId1 as the key
name1 = sc.parallelize(top10).map(lambda (pubCount, (charId1, charId2)): (charId1, (charId2, pubCount))).join(characters)
# Let's perform a similar join on the second character
name2 = name1.map(lambda (charId1, ((charId2, pubCount), name1)): (charId2, (name1, charId1, pubCount))).join(characters)
# Let's format the RDD a bit
formattedTop10 = name2.map(lambda (charId2, ((name1, charId1, pubCount), name2)): (pubCount, (name1, charId1, name2, charId2)))

# We need to sort the results again: when we parallelized the top10 it got partitionned and each partition moved independantly
formattedTop10.sortByKey(False).collect()
[/code]

We finally get the answer to our question:

[code language="Python"]

[(744, (u'HUMAN TORCH/JOHNNY S', 2557, u'THING/BENJAMIN J. GR', 5716)),
 (713, (u'HUMAN TORCH/JOHNNY S', 2557, u'MR. FANTASTIC/REED R', 3805)),
 (708, (u'MR. FANTASTIC/REED R', 3805, u'THING/BENJAMIN J. GR', 5716)),
 (701, (u'INVISIBLE WOMAN/SUE', 2650, u'MR. FANTASTIC/REED R', 3805)),
 (694, (u'HUMAN TORCH/JOHNNY S', 2557, u'INVISIBLE WOMAN/SUE', 2650)),
 (668, (u'INVISIBLE WOMAN/SUE', 2650, u'THING/BENJAMIN J. GR', 5716)),
 (616, (u'SPIDER-MAN/PETER PAR', 5306, u'WATSON-PARKER, MARY', 6166)),
 (526, (u'JAMESON, J. JONAH', 2959, u'SPIDER-MAN/PETER PAR', 5306)),
 (446, (u'CAPTAIN AMERICA', 859, u'IRON MAN/TONY STARK', 2664)),
 (422, (u'SCARLET WITCH/WANDA', 4898, u'VISION', 6066))]

[/code]

It turns out the top 10 is dominated by members of the Fantastic Four, which makes sense since the four of them typically appear together.
<h2>Observations</h2>
Let’s make some observations before wrapping up.

Python Spark allows to easily manipulate big data structures.  The RDD abstraction allows us to perform set operations on arbitrarily large data sets in an elegant way.

Compute time is relatively fast given the task at hand.

RDD aren’t typed:  each row can have a different format, there are no “column” names, etc.  .  This makes it easy to start but as the Notebook gets bigger, we need to refer to where an RDD was defined to remember its structure.

RDD abstraction is great but quickly gets cumbersome when we try to perform sorts and join:  we then need to remap the RDD to get the right key in place.
<h2>Summary</h2>
We hope this was an easy enough introduction to Python Spark using RDD.

Although RDD are powerful yet simple, we’ve identified two short comings:  no-typing and weakness to perform non-trivial queries.

Those shortcomings are actually addressed within the Spark platform with Data Frames &amp; Spark SQL as we’ll see in Future Articles.

Nevertheless, it is useful to understand RDDs as they often are the entry points for some Spark crunching, especially if the data isn't structured or comes in non-standard files and needs some massaging before being ingested in a Data Frame.

<strong>UPDATE (24-01-2018):  See <a href="https://vincentlauzon.com/2018/01/24/azure-databricks-spark-sql-data-frames/" rel="bookmark">Azure Databricks – Spark SQL – Data Frames</a> for details.</strong>