---
title: Python Version in Databricks
date: 2018-04-18 03:30:11 -07:00
permalink: /2018/04/18/python-version-in-databricks/
categories:
- Solution
tags:
- Big Data
- Data
---
In the last few months, we’ve looked at Azure Databricks:
<ul>
 	<li><a href="https://vincentlauzon.com/2017/12/18/azure-databricks-getting-started/">Getting Started</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/17/azure-databricks-rdd-resilient-distributed-dataset/">Resilient Distributed Dataset</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/24/azure-databricks-spark-sql-data-frames/">Spark SQL – Data Frames</a></li>
 	<li><a href="https://vincentlauzon.com/2018/01/31/transforming-data-frames-in-spark/">Transforming Data Frames in Spark</a></li>
 	<li><a href="https://vincentlauzon.com/2018/02/07/parsing-escaping-csv-files-in-spark/">Parsing escaping CSV files in Spark</a></li>
 	<li><a href="https://vincentlauzon.com/2018/02/27/import-notebooks-in-databricks/">Import Notebooks in Databricks</a></li>
</ul>
<div>
<div class="public-DraftStyleDefault-block public-DraftStyleDefault-ltr"></div>
</div>
<div>
<div class="public-DraftStyleDefault-block public-DraftStyleDefault-ltr">In those articles, we used the Python SDK (also a bit of Spark SQL).  In this article, we’ll discuss the version of Python deployed in the Cluster.</div>
</div>
<h2>Python 2 vs Python 3</h2>
There are a lot of discussions online around Python 2 and Python 3.  We won’t try to reproduce it here.

We’ll only refer to the <a href="https://wiki.python.org/moin/Python2orPython3">Python’s wiki discussion</a> and quote their short description:

<em>Python 2.x is legacy, Python 3.x is the present and future of the language</em>

In general, we would want to use version 3+.  We would fall back on version 2 if we are using legacy packages.
<h2>Python Version in Azure Databricks</h2>
The Python version running in a cluster is a property of the cluster:

<a href="/assets/posts/2018/2/python-version-in-databricks/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/2/python-version-in-databricks/image_thumb6.png" alt="image" border="0" /></a>

As the time of this writing, i.e. end-of-March 2018, the default is version 2.

We can also see this by running the following command in a notebook:

```python

import sys

sys.version
```

We can change that by editing the cluster configuration.  It requires the cluster to restart to take effect.
<h2>Summary</h2>
Python runtime version is critical.
<div>
<div class="public-DraftStyleDefault-block public-DraftStyleDefault-ltr">Running certain packages requires a specific version.  Even some native language features are bound to runtime version.  We need to control the runtime version.</div>
</div>
We’ve seen here how to do that.