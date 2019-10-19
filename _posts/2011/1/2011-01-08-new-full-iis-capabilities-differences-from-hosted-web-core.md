---
title: 'New Full IIS Capabilities: Differences from Hosted Web Core'
date: 2011-01-08 12:12:00 -05:00
permalink: /2011/01/08/new-full-iis-capabilities-differences-from-hosted-web-core/
categories:
- Solution
tags: []
---
<p>The Windows Azure Team has posted a <a href="http://blogs.msdn.com/b/windowsazure/archive/2010/12/02/new-full-iis-capabilities-differences-from-hosted-web-core.aspx">blog entry</a> explaining the new <em>Full IIS Capabilities</em> in Windows Azure Hosting.</p>  <p>It is an interesting read.&#160; Basically the full IIS feature is enabled via the configuration of your package.</p>  <p>The very important caveat is the following:&#160; the IIS Process isn’t the web role process.&#160; This has the big implication that your role hooks (i.e. <em>RoleEntryPoint</em>) do not run in the same process than your application.&#160; Read the blog entry in order to see how to alleviate to that problem.</p>