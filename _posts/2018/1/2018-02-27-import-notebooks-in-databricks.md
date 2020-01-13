---
title: Import Notebooks in Databricks
date: 2018-02-27 03:30:09 -08:00
permalink: /2018/02/27/import-notebooks-in-databricks/
categories:
- Solution
tags:
- Big Data
- Data
---
<a href="/assets/posts/2018/1/import-notebooks-in-databricks/pexels-photo-70418.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-70418" src="/assets/posts/2018/1/import-notebooks-in-databricks/pexels-photo-70418_thumb.jpg" alt="pexels-photo-70418" width="320" height="213" align="right" border="0" /></a>

We’ve recently looked Azure Databricks:
<ul>
 	<li><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/">Getting Started</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">Resilient Distributed Dataset</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/24/azure-databricks-spark-sql-data-frames/">Spark SQL – Data Frames</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/31/transforming-data-frames-in-spark/">Transforming Data Frames in Spark</a></li>
 	<li><a href="https://vincentlauzon.com/2018/02/07/parsing-escaping-csv-files-in-spark/">Parsing escaping CSV files in Spark</a></li>
</ul>
In most cases we did share <a href="https://github.com/vplauzon/databricks">notebooks on GitHub</a>.

Here we wanted to show how easy it is to import those notebooks.
<h2>Choosing a Notebook</h2>
First, let’s choose a notebook.  We can pick a notebook from our own computer but we wanted to show how easy it is to import one from GitHub.  GitHub exposes public URLs which makes it real easy.

Let’s go into the <em>ted</em> folder of our GitHub repo:  <a title="https://github.com/vplauzon/databricks/tree/master/ted" href="https://github.com/vplauzon/databricks/tree/master/ted">https://github.com/vplauzon/databricks/tree/master/ted</a>.

From there we can click on <a href="https://github.com/vplauzon/databricks/blob/master/ted/ted.ipynb">ted.ipynb</a>.  GitHub actually renders Jupyter notebooks, which is nice.  But let’s take the raw version of the file by clicking the raw button:

<a href="/assets/posts/2018/1/import-notebooks-in-databricks/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/import-notebooks-in-databricks/image_thumb.png" alt="image" border="0" /></a>

This will lead to the raw content of the file (which happens to be JSON based).  Let’s copy the URL (<a title="https://raw.githubusercontent.com/vplauzon/databricks/master/ted/ted.ipynb" href="https://raw.githubusercontent.com/vplauzon/databricks/master/ted/ted.ipynb">https://raw.githubusercontent.com/vplauzon/databricks/master/ted/ted.ipynb</a>).
<h2>Import in Databricks workspace</h2>
In Databricks’ portal, let’s first select the workspace menu.

<a href="/assets/posts/2018/1/import-notebooks-in-databricks/image1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/import-notebooks-in-databricks/image_thumb1.png" alt="image" border="0" /></a>

Let’s pull down the Workspace menu and select <em>Import</em>.

<a href="/assets/posts/2018/1/import-notebooks-in-databricks/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/import-notebooks-in-databricks/image_thumb2.png" alt="image" width="617" height="378" border="0" /></a>

We get an <em>Import Notebooks</em> pop-up.  Default configuration imports from File, i.e. local file.  This is where we could import a Jupyter notebook from our local file system.

We want to import from GitHub, so let’s select the <em>URL</em> option.

<a href="/assets/posts/2018/1/import-notebooks-in-databricks/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/import-notebooks-in-databricks/image_thumb3.png" alt="image" border="0" /></a>

From there we can paste the notebook raw URL from GitHub and click <em>Import</em>.

<a href="/assets/posts/2018/1/import-notebooks-in-databricks/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/import-notebooks-in-databricks/image_thumb4.png" alt="image" border="0" /></a>

This imports the notebook file and creates a notebook in our workspace.
<h2>Summary</h2>
It is pretty easy to import a Notebook from GitHub or other public URLs.  We can also save notebooks on our computer and import them from files.

Databricks allows collaboration within a team via workspaces.  It also allows collaboration across teams by importing / exporting notebooks.