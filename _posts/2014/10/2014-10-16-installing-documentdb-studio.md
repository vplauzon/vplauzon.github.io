---
title:  Installing DocumentDB Studio
date:  10/17/2014 03:30:48
permalink:  "/2014/10/16/installing-documentdb-studio/"
categories:
- Solution
tags:
- NoSQL
---
<p>As I <a href="2014/10/15/documentdb-studio/">announced yesterday</a>, I released the first Beta version of <a href="https://studiodocumentdb.codeplex.com/">DocumentDB Studio</a>. <span style="font-size:12pt;">
		</span></p><p><em>DocumentDB Studio</em> is to <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">Azure DocumentDB</a> what SQL Management Studio is to SQL Server and SQL Azure: a one-stop shop to manage and interact with your DocumentDB. 
</p><p>In this blog post I'll simply walk you through the installation process.
</p><h2>Installation 
</h2><p>Simply go to <a href="https://studiodocumentdb.codeplex.com/">https://studiodocumentdb.codeplex.com/</a> and follow the big download link on the main page. 
</p><p><img src="assets/2014/10/installing-documentdb-studio/101714_0132_managingdat1.png" alt="" />
	</p><p>The current release is version 0.1.0.38356 but by the time you read this it might be higher. 
</p><p>The current deployment package is a zip file. I wanted to do a <a href="http://vincentlauzon.com/2014/09/17/clickonce-on-codeplex-com/">Click Once deployment</a> but with a self-signing certificate, Windows 8 seems to refuse to execute it (for security reason), so I fell back on a local install.  If you know a way around it, please drop me a line.
</p><p>There are <strong>no install file</strong>, simply unzip the file somewhere, e.g. on your desktop.  Execute StudioDocDB.exe:
</p><p><img src="assets/2014/10/installing-documentdb-studio/101714_0330_installingd1.png" alt="" />
	</p><p>If you run Windows 8, it might complain about the fact it doesn't recognize the application.  In that case, click <em>More Info</em>:
</p><p><img src="assets/2014/10/installing-documentdb-studio/101714_0330_installingd2.png" alt="" />
	</p><p>Then click <em>Run anyway</em>
	</p><p><img src="assets/2014/10/installing-documentdb-studio/101714_0330_installingd3.png" alt="" />
	</p><p>I'll try to smooth those things out in future release!
</p><p>After those steps you should see the app!
</p><p><img src="assets/2014/10/installing-documentdb-studio/101714_0330_installingd4.png" alt="" />
	</p>