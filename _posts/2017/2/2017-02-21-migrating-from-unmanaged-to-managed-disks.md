---
title:  Migrating from unmanaged to managed disks
date:  2017-02-21 11:00:02 -05:00
permalink:  "/2017/02/21/migrating-from-unmanaged-to-managed-disks/"
categories:
- Solution
tags:
- Virtual Machines
---
We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s migrate existing VMs from unmanaged to managed disks.
<h3>Install pre-requisites</h3>
Update your Microsoft Azure PowerShell to the latest bits in order to include Managed Disks functionalities
<h3>Deploy ARM Template</h3>
[code language="JavaScript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;VM Admin User Name&quot;: {
      &quot;defaultValue&quot;: &quot;myadmin&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Admin Password&quot;: {
      &quot;defaultValue&quot;: null,
      &quot;type&quot;: &quot;securestring&quot;
    },
    &quot;Storage Account Name&quot;: {
      &quot;defaultValue&quot;: &quot;&lt;your prefix&gt;vmstandard&quot;,
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;VM Size&quot;: {
      &quot;defaultValue&quot;: &quot;Standard_DS4&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Standard_DS1&quot;,
        &quot;Standard_DS2&quot;,
        &quot;Standard_DS3&quot;,
        &quot;Standard_DS4&quot;,
        &quot;Standard_DS5&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SKU of the VM.&quot;
      }
    },
    &quot;Public Domain Label&quot;: {
      &quot;type&quot;: &quot;string&quot;
    },
    &quot;Instance Count&quot;: {
      &quot;defaultValue&quot;: 3,
      &quot;type&quot;: &quot;int&quot;
    }
  },
  &quot;variables&quot;: {
    &quot;Vhds Container Name&quot;: &quot;vhds&quot;,
    &quot;frontIpRange&quot;: &quot;10.0.1.0/24&quot;,
    &quot;Public IP Name&quot;: &quot;MyPublicIP&quot;,
    &quot;Public LB Name&quot;: &quot;PublicLB&quot;,
    &quot;Front Address Pool Name&quot;: &quot;frontPool&quot;,
    &quot;Front NIC loop Name&quot;: &quot;frontNicLoop&quot;,
    &quot;Front NIC Prefix&quot;: &quot;frontNic&quot;,
    &quot;Front VM loop Name&quot;: &quot;frontVMLoop&quot;,
    &quot;Front VM Prefix&quot;: &quot;Demo-VM&quot;,
    &quot;Front Availability Set Name&quot;: &quot;frontAvailSet&quot;,
    &quot;Private LB Name&quot;: &quot;PrivateLB&quot;,
    &quot;VNET Name&quot;: &quot;Demo-VNet&quot;
  },
  &quot;resources&quot;: [
    {
      &quot;type&quot;: &quot;Microsoft.Network/publicIPAddresses&quot;,
      &quot;name&quot;: &quot;[variables('Public IP Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public IP&quot;
      },
      &quot;properties&quot;: {
        &quot;publicIPAllocationMethod&quot;: &quot;Dynamic&quot;,
        &quot;idleTimeoutInMinutes&quot;: 4,
        &quot;dnsSettings&quot;: {
          &quot;domainNameLabel&quot;: &quot;[parameters('Public Domain Label')]&quot;
        }
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/virtualNetworks&quot;,
      &quot;name&quot;: &quot;[variables('VNet Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;addressSpace&quot;: {
          &quot;addressPrefixes&quot;: [
            &quot;10.0.0.0/16&quot;
          ]
        },
        &quot;subnets&quot;: [
          {
            &quot;name&quot;: &quot;front&quot;,
            &quot;properties&quot;: {
              &quot;addressPrefix&quot;: &quot;[variables('frontIpRange')]&quot;,
              &quot;networkSecurityGroup&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
              }
            }
          }
        ]
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/loadBalancers&quot;,
      &quot;name&quot;: &quot;[variables('Public LB Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Public Load Balancer&quot;
      },
      &quot;properties&quot;: {
        &quot;frontendIPConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;LoadBalancerFrontEnd&quot;,
            &quot;comments&quot;: &quot;Front end of LB:  the IP address&quot;,
            &quot;properties&quot;: {
              &quot;publicIPAddress&quot;: {
                &quot;id&quot;: &quot;[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]&quot;
              }
            }
          }
        ],
        &quot;backendAddressPools&quot;: [
          {
            &quot;name&quot;: &quot;[variables('Front Address Pool Name')]&quot;
          }
        ],
        &quot;loadBalancingRules&quot;: [
          {
            &quot;name&quot;: &quot;Http&quot;,
            &quot;properties&quot;: {
              &quot;frontendIPConfiguration&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]&quot;
              },
              &quot;frontendPort&quot;: 80,
              &quot;backendPort&quot;: 80,
              &quot;enableFloatingIP&quot;: false,
              &quot;idleTimeoutInMinutes&quot;: 4,
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;loadDistribution&quot;: &quot;Default&quot;,
              &quot;backendAddressPool&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
              },
              &quot;probe&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]&quot;
              }
            }
          }
        ],
        &quot;probes&quot;: [
          {
            &quot;name&quot;: &quot;TCP-Probe&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;port&quot;: 80,
              &quot;intervalInSeconds&quot;: 5,
              &quot;numberOfProbes&quot;: 2
            }
          }
        ],
        &quot;inboundNatRules&quot;: [],
        &quot;outboundNatRules&quot;: [],
        &quot;inboundNatPools&quot;: []
      },
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]&quot;
      ]
    },
    {
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;name&quot;: &quot;frontNsg&quot;,
      &quot;type&quot;: &quot;Microsoft.Network/networkSecurityGroups&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {
        &quot;securityRules&quot;: [
          {
            &quot;name&quot;: &quot;Allow-HTTP-From-Internet&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;80&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;Internet&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-RDP-From-Everywhere&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;Tcp&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;3389&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 150,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-Health-Monitoring&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;AzureLoadBalancer&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Inbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 300,
              &quot;direction&quot;: &quot;Inbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Allow-to-VNet&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;VirtualNetwork&quot;,
              &quot;access&quot;: &quot;Allow&quot;,
              &quot;priority&quot;: 100,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          },
          {
            &quot;name&quot;: &quot;Disallow-everything-else-Outbound&quot;,
            &quot;properties&quot;: {
              &quot;protocol&quot;: &quot;*&quot;,
              &quot;sourcePortRange&quot;: &quot;*&quot;,
              &quot;destinationPortRange&quot;: &quot;*&quot;,
              &quot;sourceAddressPrefix&quot;: &quot;*&quot;,
              &quot;destinationAddressPrefix&quot;: &quot;*&quot;,
              &quot;access&quot;: &quot;Deny&quot;,
              &quot;priority&quot;: 200,
              &quot;direction&quot;: &quot;Outbound&quot;
            }
          }
        ],
        &quot;subnets&quot;: []
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Network/networkInterfaces&quot;,
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;[variables('Front NIC loop Name')]&quot;,
        &quot;count&quot;: &quot;[parameters('Instance Count')]&quot;
      },
      &quot;name&quot;: &quot;[concat(variables('Front NIC Prefix'), '-', copyIndex())]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front NICs&quot;
      },
      &quot;apiVersion&quot;: &quot;2016-03-30&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;ipConfigurations&quot;: [
          {
            &quot;name&quot;: &quot;ipconfig&quot;,
            &quot;properties&quot;: {
              &quot;privateIPAllocationMethod&quot;: &quot;Dynamic&quot;,
              &quot;subnet&quot;: {
                &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]&quot;
              },
              &quot;loadBalancerBackendAddressPools&quot;: [
                {
                  &quot;id&quot;: &quot;[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]&quot;
                }
              ]
            }
          }
        ],
        &quot;dnsSettings&quot;: {
          &quot;dnsServers&quot;: []
        },
        &quot;enableIPForwarding&quot;: false
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]&quot;,
        &quot;[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Compute/virtualMachines&quot;,
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;[variables('Front VM loop Name')]&quot;,
        &quot;count&quot;: &quot;[parameters('Instance Count')]&quot;
      },
      &quot;name&quot;: &quot;[concat(variables('Front VM Prefix'), '-', copyIndex())]&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Front VMs&quot;
      },
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;properties&quot;: {
        &quot;availabilitySet&quot;: {
          &quot;id&quot;: &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
        },
        &quot;hardwareProfile&quot;: {
          &quot;vmSize&quot;: &quot;[parameters('VM Size')]&quot;
        },
        &quot;storageProfile&quot;: {
          &quot;imageReference&quot;: {
            &quot;publisher&quot;: &quot;MicrosoftWindowsServer&quot;,
            &quot;offer&quot;: &quot;WindowsServer&quot;,
            &quot;sku&quot;: &quot;2012-R2-Datacenter&quot;,
            &quot;version&quot;: &quot;latest&quot;
          },
          &quot;osDisk&quot;: {
            &quot;name&quot;: &quot;[concat(variables('Front VM Prefix'), '-', copyIndex())]&quot;,
            &quot;createOption&quot;: &quot;FromImage&quot;,
            &quot;vhd&quot;: {
              &quot;uri&quot;: &quot;[concat('https', '://', parameters('Storage Account Name'), '.blob.core.windows.net', concat('/', variables('Vhds Container Name'),'/', variables('Front VM Prefix'), '-', copyIndex(),'-os-disk.vhd'))]&quot;
            },
            &quot;caching&quot;: &quot;ReadWrite&quot;
          },
          &quot;dataDisks&quot;: []
        },
        &quot;osProfile&quot;: {
          &quot;computerName&quot;: &quot;[concat(variables('Front VM Prefix'), '-', copyIndex())]&quot;,
          &quot;adminUsername&quot;: &quot;[parameters('VM Admin User Name')]&quot;,
          &quot;windowsConfiguration&quot;: {
            &quot;provisionVMAgent&quot;: true,
            &quot;enableAutomaticUpdates&quot;: true
          },
          &quot;secrets&quot;: [],
          &quot;adminPassword&quot;: &quot;[parameters('VM Admin Password')]&quot;
        },
        &quot;networkProfile&quot;: {
          &quot;networkInterfaces&quot;: [
            {
              &quot;id&quot;: &quot;[resourceId('Microsoft.Network/networkInterfaces', concat(variables('Front NIC Prefix'), '-', copyIndex()))]&quot;
            }
          ]
        }
      },
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Storage/storageAccounts', parameters('Storage Account Name'))]&quot;,
        &quot;[variables('Front NIC loop Name')]&quot;,
        &quot;[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]&quot;
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Storage/storageAccounts&quot;,
      &quot;sku&quot;: {
        &quot;name&quot;: &quot;Standard_LRS&quot;,
        &quot;tier&quot;: &quot;Standard&quot;
      },
      &quot;kind&quot;: &quot;Storage&quot;,
      &quot;name&quot;: &quot;[parameters('Storage Account Name')]&quot;,
      &quot;apiVersion&quot;: &quot;2016-01-01&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;tags&quot;: {},
      &quot;properties&quot;: {},
      &quot;resources&quot;: [],
      &quot;dependsOn&quot;: []
    },
    {
      &quot;name&quot;: &quot;[variables('Front Availability Set Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Compute/availabilitySets&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;apiVersion&quot;: &quot;2015-06-15&quot;,
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;FrontAvailabilitySet&quot;
      },
      &quot;properties&quot;: {
        &quot;platformUpdateDomainCount&quot;: 5,
        &quot;platformFaultDomainCount&quot;: 3
      },
      &quot;dependsOn&quot;: []
    }
  ]
}
[/code]
<ol>
 	<li>We used the resource group named <i>md-demo-migrate</i>.</li>
 	<li>This deploys a few VMs (by default 3) into an availability set using standard storage in a storage account</li>
 	<li>The deployment <b>takes a few minutes</b></li>
</ol>
<h3>Look at deployment</h3>
<ol>
 	<li>Select one of the VMs (e.g. <i>Demo-VM-0</i>)</li>
 	<li>Select the disk tab
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image002.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image002" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image002_thumb.jpg" /></a></li>
 	<li>Notice there is one disk (the OS disk) ; also notice the size isn’t specified
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image004.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image004" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image004_thumb.jpg" alt="clip_image004" border="0" /></a></li>
 	<li>Select the disk
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image006.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image006" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image006_thumb.jpg" alt="clip_image006" border="0" /></a></li>
 	<li>Notice the VHD URI and also, a few details (e.g. IOPs limit) aren’t specified</li>
 	<li>Go back to the resource group and select the availability set, i.e. <i>frontAvailSet</i></li>
 	<li>Notice under <i>Managed</i> is <i>No</i>
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image008.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image008" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image008_thumb.jpg" alt="clip_image008" border="0" /></a></li>
 	<li>Notice the 3 VMs are under the availability set</li>
</ol>
<h3>Login into ISE</h3>
<ol>
 	<li>Open up PowerShell ISE</li>
 	<li>Type Add-AzureRmAccount</li>
 	<li>Enter your credentials ; those credentials should be the same you are using to log into the Azure Portal</li>
 	<li>If you have more than one subscriptions</li>
</ol>
<ol>
 	<li>Type Get-AzureRmSubscription</li>
 	<li>This should list all subscriptions you have access (even partial) to</li>
 	<li>Select the <i>SubscriptionId</i> (a GUID) of the subscription you want to use</li>
 	<li>Type Select-AzureRmSubscription -SubscriptionId &lt;SubscriptionId&gt;
<i>&lt;SubscriptionId&gt;</i> is the value you just selected</li>
 	<li>This will select the specified subscription as the “current one”, i.e. future queries will be done against that subscription</li>
</ol>
<h3>Migrate to Disks</h3>
<ol>
 	<li>In PowerShell ISE, type
$rgName = 'md-demo-migrate' # or the Resource Group name you used
$avSetName = 'frontAvailSet'
$avSet = Get-AzureRmAvailabilitySet -ResourceGroupName $rgName -Name $avSetName
Update-AzureRmAvailabilitySet -AvailabilitySet $avSet -Managed</li>
 	<li>This converts the availability set into a <i>managed</i> availability set</li>
 	<li>In PowerShell ISE, type
foreach($vmInfo in $avSet.VirtualMachinesReferences)
{
$vm = Get-AzureRmVM -ResourceGroupName $rgName | where {$_.Id -eq $vmInfo.id}
Stop-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force
ConvertTo-AzureRmVMManagedDisk -ResourceGroupName $rgName -VMName $vm.Name
}</li>
 	<li>This shuts down each VM before converting each disk to a managed disk</li>
 	<li>This operation takes a while to execute</li>
 	<li>In the portal, go back to the availability set</li>
 	<li>Notice it is now managed
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image010.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image010" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image010_thumb.jpg" alt="clip_image010" border="0" /></a></li>
 	<li>A managed availability set has the following characteristics:</li>
</ol>
<ol>
 	<li>It doesn’t let us add a <i>new</i> VM with unmanaged disk</li>
 	<li>It aligns the failure domain of the availability set with the disks</li>
</ol>
<h3>Look at managed disk</h3>
<ol>
 	<li>Once at least one VM has been converted, notice it restarts</li>
 	<li>In the portal, go back to the resource group</li>
 	<li>Notice the disk resources
<a href="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image012.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image012" src="assets/2017/2/migrating-from-unmanaged-to-managed-disks/clip_image012_thumb.jpg" alt="clip_image012" border="0" /></a></li>
 	<li>Select one of the disk</li>
 	<li>Notice the size of the disk is specified, i.e. 128GB</li>
 	<li>This is one of the predefined standard disk size, in this case S10</li>
 	<li>Notice the source blob is still there ; this is because copy-on-read is used to copy the disk while the VM is running</li>
 	<li>Notice the <i>account type</i> can be changed</li>
 	<li>We can delete the storage account</li>
</ol>
<h3>Migrate to Premium Disks</h3>
<ol>
 	<li>In PowerShell, type
$disks = Get-AzureRmDisk -ResourceGroupName $rgName
foreach($disk in $disks)
{
$vm = Get-AzureRmResource -ResourceId $disk.OwnerId
Stop-AzureRmVM -Id $disk.OwnerId -Name $vm.Name -Force
$diskUpdateConfig = New-AzureRmDiskUpdateConfig –AccountType PremiumLRS
Update-AzureRmDisk -DiskUpdate $diskUpdateConfig -ResourceGroupName $rgName -DiskName $disk.Name
}</li>
 	<li>Again, this script will take a while to execute since it does stop VMs</li>
 	<li>The script will go one by one and migrate the disks to premium storage</li>
 	<li>This is possible because the VM size was DS series that support premium storage</li>
</ol>
<h3>Notes</h3>
Once we’ve tested the procedure in non-production environment, this migration procedure can be applied to production. The shutdown / convert should then be done one update domain (or one VM) at the time to avoid any downtime.
<h3>Exercise</h3>
Try to migrate the account type back to standard storage.
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them.

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-migrate -Force