using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;

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
namespace jSignature.tests
{
    using jSignature;

    public static class Common
    {
        // this normally resolves to something like: file:\C:\\path\to\proj\folder\bin\Debug
        public static string EXECUTING_ASSEMBLY_PATH = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().GetName().CodeBase);
        private static string _SOURCE_PATH = null;
        public static string SOURCE_PATH
        {
            get
            {
                if (_SOURCE_PATH == null)
                {
                    Regex r = new Regex(@"file:\\|bin\\Debug$|bin\\Release$");
                    _SOURCE_PATH = r.Replace(Common.EXECUTING_ASSEMBLY_PATH, "");
                }
                return _SOURCE_PATH;
            }
        }
        public static string GetContents(string filename)
        {
            return System.IO.File.ReadAllText(SOURCE_PATH + "\\" + filename);
        }
    }

    public class TestBase
    {
        [TestFixtureSetUp]
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

        [TestFixtureTearDown]
        public void classdown()
        {
        }
    }

    [TestFixture]
    public class Base30plusConverterTests : TestBase
    {
        [Test]
        public void id001_test()
        {
            Assert.AreEqual(
                true
                , true
            );
        }
    }
}
