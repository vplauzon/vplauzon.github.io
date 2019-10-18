---
title:  HDInsight Hadoop Hive - Setup
date:  09/27/2015 23:00:13
permalink:  "/2015/09/27/hdinsight-hadoop-hive-setup/"
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="https://vincentlauzon.files.wordpress.com/2015/09/hive_logo_medium1.jpg"><img class="size-full wp-image-1225 alignleft" src="https://vincentlauzon.files.wordpress.com/2015/09/hive_logo_medium1.jpg" alt="hive_logo_medium[1]" width="114" height="105" /></a>Let's explore <a href="http://hive.apache.org/" target="_blank">Hadoop Hive</a>, shall we?

Hive is a <a href="https://en.wikipedia.org/wiki/Apache_Hive" target="_blank">data warehouse infrastructure built on top of Hadoop for providing data summarization, query, and analysis</a>.

It was originally build by <a href="http://facebook.com/" target="_blank">Facebook </a>as an abstraction on top of Hadoop Map Reduce and now is an open source (Apache) project.

(See my <a href="http://vincentlauzon.com/2015/09/20/hadoop-ecosystem-overview/">Hadoop ecosystem overview here</a>)

As with other Hadoop main components, you have a few options to work with it:
<ul>
	<li>You can download it and install the cluster on a server farm on premise ; good luck with that, I'm sure it's going to be a nice learning experience.</li>
	<li>You can use HDInsight on-premise which is a port on Windows done in collaboration between <a href="http://hortonworks.com/" target="_blank">Hortonworks</a> &amp; Microsoft.</li>
	<li>You can use Azure HDInsight</li>
</ul>
Yes, if you read anything in this blog, you know I'm gona go with the Azure option!

I'll give two major things to <a href="http://azure.microsoft.com/en-us/services/hdinsight/" target="_blank">Azure HDInsight</a>:
<ol>
	<li>It performs all the cluster installation / maintenance for you</li>
	<li>It (mostly) shields you from all the Unixy / 3000 open projects mix that is Hadoop</li>
</ol>
And for that I am grateful!  When I want to use Hive I don't want to fight with <a href="https://en.wikipedia.org/wiki/Bash_(Unix_shell)" target="_blank">Bash shells</a>, I want to run some SQL over Big Data.
<h3>Hadoop</h3>
Just before we start...  what is Hive in a nutshell?

Hive allows you to query massive data sets (Big Data) without hand coding Java Map Reduce into Hadoop.

So it's an abstraction layer and a productivity enhancer.
<h3>Setting it up</h3>
Alright, <a href="https://portal.azure.com" target="_blank">Azure Portal (preview)</a> everyone.  Yeah!  Give the preview portal some love!
<h3>SQL Database</h3>
What?  Yeah...  there's the thing...

Here I'll show you how to manage an Hadoop / Hive cluster on the cheap.  One of the nice feature of Azure HDInsight is to externalize the Hive metastore (where the schemas of your tables will be stored) from the cluster.

This will allow you to tear down the cluster without losing your Hive Metadata.

By default the metastore is persisted on a <a href="http://db.apache.org/derby/" target="_blank">Derby database</a> (yes, chances are you never heard about that, remember what I told you about Azure HDInsight shielding you from all this Open Source Techs?) which is hosted on the cluster.

The alternative is to host it on an Azure SQL Database, outside the cluster.

So let's create a DB.

<a href="https://vincentlauzon.files.wordpress.com/2015/09/sql.png"><img class="alignnone size-full wp-image-1233" src="https://vincentlauzon.files.wordpress.com/2015/09/sql.png" alt="SQL" width="700" height="420" /></a>

Top left corner, (+ NEW), Data + Storage, SQL Database:  this opens up the New SQL Database blade.

Go for it.  Just be careful of a few things, namely:
<ul>
	<li>Make sure it's in the right subscription</li>
	<li>Make sure it's in the region (e.g. East US) you want your cluster to be</li>
	<li>Make sure you tick "Allow azure services to access server" to let Hadoop access it</li>
</ul>
<h3>HDInsight</h3>
Now the HDInsight cluster!

<a href="https://vincentlauzon.files.wordpress.com/2015/09/newhdinsight.png"><img class="alignnone size-full wp-image-1228" src="https://vincentlauzon.files.wordpress.com/2015/09/newhdinsight.png" alt="NewHdInsight" width="700" height="216" /></a>

Top left corner, (+ NEW), Data + Analytics, HDInsight:  this opens up the New HDInsight Cluster blade.

Cluster Name:  choose one, needs to be unique within the universe of HDInsight, hence I won't give you mine, you would clash with it.

Cluster Type:  Hadoop.

Cluster Operating System:  leave it to Windows Server.

Make sure it's in the right subscription and the right resource group.

Click Credentials, that's going to pull the credentials blade.

<a href="https://vincentlauzon.files.wordpress.com/2015/09/credentials.png"><img class="alignnone size-full wp-image-1230" src="https://vincentlauzon.files.wordpress.com/2015/09/credentials.png" alt="Credentials" width="264" height="375" /></a>

Those are the credentials to authenticate to the cluster.  We're just toying around, so don't go overboard.  You do not need to enable the remote desktop for this.
<h3>Data Source</h3>
Ok, Data Source.  This will open the...  Data Source blade!

One of the differentiator of Azure HDInsight compared to other Hadoop implementation is that the distributed file system (HDFS) is implemented on top of Azure Blob Storage.  This is commonly known as <a href="http://blogs.msdn.com/b/cindygross/archive/2015/02/04/understanding-wasb-and-hadoop-storage-in-azure.aspx" target="_blank">WASB: Windows Azure Storage Blob</a>.

To make a story short:
<ul>
	<li>Hadoop comes with HDFS, Hadoop File System, a distributed File System</li>
	<li>Files on HDFS are spread and replicated on many data nodes of your clusters</li>
	<li>This means files in HDFS belongs to your cluster and can't exist without it</li>
	<li>WASB is an implementation of HDFS that simply forwards to Blob Storage which is already a distributed / replicated file system</li>
	<li>WASB allows your files to exist without your cluster</li>
</ul>
The last point is key.  It means you can tear your cluster down and you keep your file.  You can later on recreate a cluster and continue where you were.

So...  I suggest you create a storage account just for your Hive discovery.

<a href="https://vincentlauzon.files.wordpress.com/2015/09/data-source.png"><img class="alignnone size-full wp-image-1232" src="https://vincentlauzon.files.wordpress.com/2015/09/data-source.png" alt="Data Source" width="257" height="382" /></a>

Again, give it a unique name.  You can choose your default container which will itself default to the name of your cluster.
<h3>Node Pricing Tier</h3>
Again, we're in discovery.  Let's go easy on it:  one worker node and you can drop the type of VMs for the worker &amp; header nodes to A3 (the cheapest).
<h3>Optional Configuration</h3>
<a href="https://vincentlauzon.files.wordpress.com/2015/09/optionalconfig.png"><img class="alignnone size-full wp-image-1234" src="https://vincentlauzon.files.wordpress.com/2015/09/optionalconfig.png" alt="OptionalConfig" width="256" height="394" /></a>

In optional configuration, let's select external metastores and select the SQL Database we created earlier.

Only do that for the Hive metastore (we won't use Oozie today).  You can give your server admin password for today but DO NOT DO THAT in production.  In production, of course, create a separate user that has rights only on the specific db.
<h3>Create</h3>
Finally, hit the create button!  This will churn away for a little while and you'll have your cluster ready soon!
<h3>Key take aways</h3>
As key take aways, there are two pieces of your Azure HDInsight configuration that can survive the deletion of your cluster:
<ol>
	<li>HDFS content (via a storage account)</li>
	<li>Hive Metastore (via an Azure SQL Database)</li>
</ol>
This makes Azure HDInsight a component you can prop up to do heavy computation and tear down until next time.

You could even go a step further and backup your database into a .bacpac and tear down the SQL Database until next use.  This way you would end up paying only for storage which is dirt cheap compare to both SQL and Hadoop.

In the next blog entry, we'll actually use the Hadoop cluster to do some Hive!