Imports System
Imports System.Collections.Generic
Imports System.Text

Namespace jSignature.Tools
    Public Class Stats
        Private data As Integer()()()
        Private _content_dimensions As Integer()

        Private Sub _calc_content_dimensions()
            Dim x As Integer
            Dim y As Integer
            Dim minx As Integer = System.Int32.MaxValue
            Dim miny As Integer = System.Int32.MaxValue
            Dim maxx As Integer = System.Int32.MinValue
            Dim maxy As Integer = System.Int32.MinValue

            For Each stroke As Integer()() In Me.data
                Dim lastx As Integer = 0
                Dim lasty As Integer = 0

                For Each coordinate As Integer() In stroke
                    x = lastx + coordinate(0)
                    y = lasty + coordinate(1)
                    If x < minx Then minx = x
                    If x > maxx Then maxx = x
                    If y < miny Then miny = y
                    If y > maxy Then maxy = y
                    lastx = x
                    lasty = y
                Next
            Next

            Me._content_dimensions = New Integer() {minx, miny, maxx, maxy}
        End Sub

        Public Sub New(ByVal data As Integer()()())
            Me.data = data
            _calc_content_dimensions()
        End Sub

        Public ReadOnly Property Size As Integer()
            Get
                Return New Integer() {Me._content_dimensions(2), Me._content_dimensions(3)}
            End Get
        End Property

        Public ReadOnly Property ContentSize As Integer()
            Get
                Return New Integer() {Me._content_dimensions(2) - Me._content_dimensions(0) + 1, Me._content_dimensions(3) - Me._content_dimensions(1) + 1}
            End Get
        End Property

        Public ReadOnly Property ContentLimits As Integer()
            Get
                Return Me._content_dimensions
            End Get
        End Property
    End Class
End Namespace
