---
title:  Managing Documents with DocumentDB Studio
date:  2014-10-22 22:23:35 -04:00
permalink:  "/2014/10/22/managing-documents-with-documentdb-studio/"
categories:
- Solution
tags:
- NoSQL
---
I released a second Beta of <a href="https://studiodocumentdb.codeplex.com/">DocumentDB Studio</a> (release 0.2.0.1).

<span style="font-family:Times New Roman;font-size:12pt;">DocumentDB Studio is to <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a> what SQL Management Studio is to SQL Server and SQL Azure: a one-stop shop to manage and interact with your DocumentDB.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">I posted an <a href="http://vincentlauzon.com/2014/10/16/installing-documentdb-studio/">installation guide</a> of the application and an <a href="http://vincentlauzon.com/2014/10/22/upgrading-documentdb-studio/">upgrade guide</a> (both very simple). I also posted a <a href="http://vincentlauzon.com/2014/10/17/managing-databases-and-collections-with-documentdb-studio/">guide to Manage Databases and collections in DocumentDB Studio</a>.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">In this post I want to walk you through the new features of release 0.2.0.1:
</span>
<ul>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Disconnect an account</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Create Documents
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">List documents under collection
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">View document from the collection
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Delete document
</span></li>
</ul>
<h2>Account keys</h2>
<span style="font-family:Times New Roman;font-size:12pt;">I assume you already have an account ; see <a href="http://vincentlauzon.com/2014/10/16/creating-an-azure-documentdb-account/">this post</a> on how to create an Azure DocumentDB Account. I also assume you have connection to the account in DocumentDB Studio ; see <a href="http://vincentlauzon.com/2014/10/17/managing-databases-and-collections-with-documentdb-studio/">this guide</a> to set it up.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">I finally assume you have at least a collection setup ; see <a href="http://vincentlauzon.com/2014/10/17/managing-databases-and-collections-with-documentdb-studio/">this guide</a> to set it up otherwise.
</span>
<h2>Disconnect an account</h2>
<span style="font-family:Times New Roman;font-size:12pt;">First, a trivial feature that was nevertheless missing from the first beta: the ability to disconnect <em>Studio</em> from an account.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">In the toolbar, click the <em>Disconnect</em> button:
</span>

<img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc1.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span>

<span style="font-family:Times New Roman;font-size:12pt;">and confirm you really want to disconnect in the dialog box.
</span>
<h2>Create Documents</h2>
<span style="font-family:Times New Roman;font-size:12pt;">Now, let's create some documents!
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Select a database collection in the tree view and click the <em>Create Document</em> button.
</span>

<img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc2.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;"><strong>
</strong></span>

<a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/"><span style="font-family:Times New Roman;font-size:12pt;">Azure DocumentDB</span></a><span style="font-family:Times New Roman;font-size:12pt;"> manages <a href="http://json.org/">Json document</a>. Let's type a simple document:
</span>
<blockquote><span style="font-family:Times New Roman;font-size:12pt;">{
firstName : "Vincent-Philippe",
lastName : "Lauzon",
isActive : true
}
</span></blockquote>
<p style="margin-left:36pt;"><span style="font-family:Times New Roman;font-size:12pt;">Simply note that json rules and types apply. Here I used strings (in double quotes) and boolean (<em>true</em> without quotes).
</span></p>
<p style="margin-left:36pt;"><span style="font-family:Times New Roman;font-size:12pt;">Then click OK to save the document to <em>Azure DocumentDB</em>.
</span></p>
<p style="margin-left:36pt;"><img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc3.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span></p>

<h2>List documents under collection</h2>
<p style="margin-left:36pt;"><span style="font-family:Times New Roman;font-size:12pt;">You should see the document appear under your collection as a <em>guid</em>.
</span></p>
<p style="margin-left:36pt;"><img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc4.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span></p>
<span style="font-family:Times New Roman;font-size:12pt;">Let's add a few other documents. <em>DocumentDB Studio</em> remembers the last JSON document you enter in that collection, which is a nice starting point.
</span>
<h2>View document from the collection</h2>
<span style="font-family:Times New Roman;font-size:12pt;">Let's</span>
<span style="font-family:Times New Roman;font-size:12pt;">select one of those document:
</span>

<img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc5.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span>

<span style="font-family:Times New Roman;font-size:12pt;">This gives us a read-only view of the document.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">You will notice the JSON document displayed is your original JSON document plus a couple of meta-data fields added by <em>Azure DocumentDB</em>. The most important of those fields is the <em>id</em>. The id is auto-generated but you can also enter manually when you type the document ; it identifies the document uniquely within a collection.</span>
<h2>Delete document</h2>
<span style="font-family:Times New Roman;font-size:12pt;">If you want to get rid of a document, simply click the <em>Remove Document</em> button and confirm you really want to delete it.
</span>

<img src="assets/2014/10/managing-documents-with-documentdb-studio/102314_0317_managingdoc6.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span>
<h2>Conclusion</h2>
<span style="font-family:Times New Roman;font-size:12pt;">This release a few key feature allowing you to explore Azure DocumentDB.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">The next key feature to be implemented is collection querying.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">If you have any feedback on DocumentDB Studio, please do not hesitate to use the <a href="https://studiodocumentdb.codeplex.com/discussions">discussion board</a>!</span>