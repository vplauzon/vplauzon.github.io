---
title: I tortured Azure in the Week-End
date: 2016-02-07 07:21:56 -05:00
permalink: /2016/02/07/i-tortured-azure-in-the-week-end/
categories:
- Solution
tags:
- Automation
---
<p>In my <a href="https://vincentlauzon.com/2016/02/05/shutting-down-vms-on-schedule-in-azure/">last blog post</a>, I showed how to author an Azure Runbook to turn VMs up and down.</p> <p>In order to test it I did put a schedule where at every hour (e.g. 1:00, 2:00, 3:00, etc.) it would start the VMs and at every pass half hour (e.g. 1:30, 2:30, 3:30, etc.).</p> <p>The thing is that I forgot it there so it ran all week-end!</p> <p><a href="/assets/2016/2/i-tortured-azure-in-the-week-end/image4.png"><img title="image" style="border-top:0;border-right:0;background-image:none;border-bottom:0;padding-top:0;padding-left:0;border-left:0;display:inline;padding-right:0;" border="0" alt="image" src="/assets/2016/2/i-tortured-azure-in-the-week-end/image_thumb4.png" width="836" height="794" /></a></p> <p>So for the better part of the week-end, Azure has been provisionning 2 VMs for half an hour then shut them down half an hour later and restarted the cycle half hour later.</p> <p>I feel like I’ve been tourmenting the damn thing!</p> <p>But at least it shows that it worked well and took about 5 minutes to start both VMs (in parallel), so that sounds about right.</p>