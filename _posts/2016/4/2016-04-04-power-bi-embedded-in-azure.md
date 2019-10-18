---
title:  Power BI Embedded in Azure
date:  04/04/2016 21:24:29
permalink:  "/2016/04/04/power-bi-embedded-in-azure/"
categories:
- Solution
tags:
- Data
---
One of the many announces of <a href="https://channel9.msdn.com/Events/Build/2016" target="_blank">Build 2016</a> (last week) is <a href="https://azure.microsoft.com/en-us/services/power-bi-embedded/" target="_blank">Power BI Embedded</a>.

On the surface you might wonder what's the difference between that and <a href="https://powerbi.microsoft.com/" target="_blank">Power BI Service</a> itself?

Power BI Service is a powerful tool.  It allows you to author reports &amp; dashboard in Power BI desktop and export them in Power BI Service (or directly in Power BI).  You can <a href="https://powerbi.microsoft.com/en-us/documentation/powerbi-service-get-started/" target="_blank">get started here</a> &amp; <a href="https://powerbi.microsoft.com/en-us/documentation/powerbi-service-basic-concepts/" target="_blank">learned the basic concepts here</a>.

Well, there are a few differences.  I see two big differences:  licensing &amp; user experience.
<h2>Licensing model</h2>
Power BI Service is technically part of Office 365.  It requires users to be part of an Office 365 enrollment of some sort and is licensed <em>per user</em>.

This is a very good solution for your enterprise since you can bundle it with other Office 365 service and pay per user.

When you want to expose your analytics to the outside world though, the licensing model breaks a bit.  Should you enlist each of your site visitor within your Office 365 enrollment?  What if a user comes only once and never comes back?

Also, maybe your web site doesn't work with AAD at all and have its own way of securing its content.

Power BI embedded brings another licensing model to the table:  pay-per-render.  You expose your Power BI artefact in your site and get them rendered by Power BI embedded.  You are charged per render (use) and not by user.  This is a consumption model.
<h2>User Experience</h2>
The other big difference is the user experience.  As its name suggest, Power BI is...  embedded in your site.

So you do not bring the whole Power BI Service site with you.  Simply the artefact's rendering.  This will render on any devices, be it mobile, tablet or desktop, Windows, Android, iPhone or Mac.

Using Power BI that way makes it a web reporting solution in the cloud.  Since the inception of Azure, it hasn't been clear what kind of reporting solution we could use with Azure solution.  SQL Reporting was offered as a service for a while before being removed.  You could bring SSRS in an IaaS deployment, but that was clashing with many customers who were using Azure Platform as a Service (PaaS) to develop their solution and found themselves having to provision VMs for the reporting part.  You could bring compact reporting solution (Web widgets) but those often fall short in terms of features.  Power BI Service came along but wasn't ideal for the aforementioned reasons.

Power BI embedded brings a solid reporting solution with modern visualization to your Azure Solutions.
<h2>Conceptual Model</h2>
With Power BI embedded, the Azure resource you provision is a Workspace collection.  That contains any number of workspaces, themselves containing data sets, reports &amp; dashboards.

You can lay out your workspace collection and workspaces the way you want.
<h2>Security</h2>
So, how does the security work since Power BI doesn't directly authenticate users?

Your application authenticates itself to Power BI, using access keys, and can then create an <em>App Token</em> with different access rights.  That app token is then pass to your HTML code which will pass it back to the Power BI service as an access token.
<h2>Conclusion</h2>
As usual I would suggest to start with the project page to get some <a href="https://azure.microsoft.com/en-us/services/power-bi-embedded/" target="_blank">glossy infographics</a> and then head to the <a href="https://azure.microsoft.com/en-us/documentation/services/power-bi-embedded/" target="_blank">documentation section</a>.  This has a Channel 9 Azure Friday video demonstrating the product and going through the main dev motions to get it working.

For me, Azure Power BI embedded finally closes the loop left open by the disappearance of SQL Reporting as a Service and allows ISV to embed stunning visuals to their web solutions.