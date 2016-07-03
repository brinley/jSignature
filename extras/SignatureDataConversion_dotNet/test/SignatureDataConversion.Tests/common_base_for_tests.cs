using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System.Reflection;
using NUnit.Framework;
                      
/*
 * Note about these tests.
 * 
 * The tests are based on NUnit framework. NUnit framework has a separate "runner" that is
 * external to Visual Studio. (Meaning, you don't "F5" it.)
 * 
 * In the folder containing this project you should find a ***.nunit file. When NUnit framework
 * is installed, double-clicking on the file will open it in the NUnit runner. Select individual
 * tests or a branch of tests and "Run"
*/


/* 
 * Test fixture template

    [TestFixture]
    public class TestGroupName : TestBase
    {

        [Test]
        public void NameOfTest()
        {
            Assert.AreEqual(
                true,
                true
                );
        }
    }

*/
namespace jSignature.Tools.Tests
{
    public static class Common
    {
        // this normally resolves to something like: file:\C:\\path\to\proj\folder\bin\Debug
        public static string EXECUTING_ASSEMBLY_PATH = Path.GetDirectoryName(typeof(Common).GetTypeInfo().Assembly.Location);
        private static string _SOURCE_PATH = null;
        public static string SOURCE_PATH
        {
            get
            {
                if (_SOURCE_PATH == null)
                {
                    //Regex r = new Regex(@"file:\\|bin\\Debug\\$|bin\\Release$");
                    //_SOURCE_PATH = r.Replace(Common.EXECUTING_ASSEMBLY_PATH, "");
                    _SOURCE_PATH = Directory.GetParent(Directory.GetParent(Directory.GetParent(EXECUTING_ASSEMBLY_PATH).FullName).FullName).FullName;
                }
                return _SOURCE_PATH;
            }
        }
    }


    public class TestBase
    {
        public string compressedtestdata = "7UZ32232263353223222333242_3w546647c9b96646475765444_6uZ69647544533210Y33544a67585ba897757988676545444_4G10Z22433223545633322411111000Y11211100000Z121223_8G56676646432Z166878886543300Y136574a487464_6GZ11122223344510000Y224333466642223222120Z2_dyZ75546542Y3656536444Z1435465443_5v0112223431121344337442222223_gHZ3424245334653141200Y142345566645_2D5546489657db46b95976443321Z12322_ey76686686676_4y00000000000";
        public string nativejsontestdata = @"[
            {""x"":[236,233,231,229,226,224,222,216,213,210,205,202,200,198,195,193,191,189,186,183,180,178,174,172]
            ,""y"":[92,97,101,107,113,117,124,136,145,156,165,171,177,181,187,191,198,203,210,216,221,225,229,233]}
            ,{""x"":[180,174,165,159,155,148,143,139,135,130,127,124,122,121,121,124,127,132,136,140,150,156,163,168,176,181,192,202,210,219,226,233,238,245,254,262,270,276,283,289,294,298,303,307,311,315]
            ,""y"":[132,133,133,131,129,125,122,119,117,115,112,107,103,98,92,89,86,83,81,79,75,74,73,72,71,70,70,70,70,71,72,74,75,76,77,77,77,77,77,77,76,74,73,71,69,66]}
            ,{""x"":[252,257,263,269,276,282,288,292,298,302,305,307,306,300,294,286,279,271,263,255,249,244,240,237,234,234,234,235,238,244,249,256,260,270,274,282,289,293,299,303]
            ,""y"":[192,191,190,189,187,185,183,181,178,175,171,167,162,161,161,161,161,161,163,165,169,172,175,178,182,188,194,200,204,206,208,210,213,215,217,219,220,222,222,220]}
            ,{""x"":[394,387,382,377,373,367,362,358,356,359,365,370,376,381,384,390,394,398,402,401,397,394,389,385,379,374,370,366,363]
            ,""y"":[151,151,152,153,155,157,159,162,166,169,170,171,173,174,177,181,185,188,191,198,202,206,208,210,212,214,216,218,221]}
            ,{""x"":[493,490,486,484,480,478,474,469,466,463,459,453,448,445,444,440,439,437,437,437,438,442,444,447,451,456,461,467,473,479,483,488]
            ,""y"":[69,74,79,83,89,93,101,110,116,121,128,141,152,156,162,173,182,187,196,203,209,213,217,220,223,225,226,225,223,220,218,216]}
            ,{""x"":[424,431,437,443,451,457,463,471,477,483,490,496],""y"":[124,124,124,124,124,124,124,124,124,124,124,124]}]";

        [OneTimeSetUp]
        public void classinit()
        {
        }

        [SetUp]
        public void testinit()
        {
        }

        [TearDown]
        public void testdeinit()
        {
        }

        [OneTimeTearDown]
        public void classdown()
        {
        }
    }
}
